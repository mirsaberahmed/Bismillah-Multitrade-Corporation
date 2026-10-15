/**
 * Device Biometric Authentication Utility (WebAuthn / Windows Hello / Apple Touch ID)
 * Allows physical fingerprint / biometric authentication directly on supported PC and laptop hardware.
 */

export async function isDeviceBiometricsAvailable(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return false;
  }
  try {
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
    return true;
  } catch (err) {
    console.warn('Biometric availability check failed:', err);
    return false;
  }
}

export async function authenticateDeviceSensor(
  identifier: string
): Promise<{ success: boolean; error?: string }> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return { success: false, error: 'WebAuthn is not supported in this browser environment.' };
  }

  try {
    const isAvailable = await isDeviceBiometricsAvailable();
    if (!isAvailable) {
      return { success: false, error: 'No hardware biometric sensor detected on this PC/laptop.' };
    }

    // 32-byte cryptographic challenge
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    // Call native platform authenticator (Windows Hello, Touch ID, or Android Biometric)
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge,
        timeout: 60000,
        userVerification: 'preferred',
        rpId: window.location.hostname
      }
    });

    if (credential) {
      return { success: true };
    }
    return { success: false, error: 'Biometric scan was not completed.' };
  } catch (err: any) {
    // If user cancelled the prompt or if no credentials exist for this RP, handle gracefully
    if (err.name === 'NotAllowedError') {
      return { success: false, error: 'Biometric prompt was cancelled or timed out.' };
    }
    if (err.name === 'SecurityError') {
      return { success: false, error: 'Security constraint prevented biometric access.' };
    }
    console.warn('WebAuthn get error:', err);
    return { success: false, error: err.message || 'Sensor authentication error.' };
  }
}
