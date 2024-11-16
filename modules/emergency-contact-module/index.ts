import EmergencyContactModule from './src/EmergencyContactModule';

export async function makePhoneCall(phoneNumber: string): Promise<void> {
  return await EmergencyContactModule.makePhoneCall(phoneNumber);
}

export async function sendSms(
  phoneNumber: string,
  message: string
): Promise<void> {
  return await EmergencyContactModule.sendSms(phoneNumber, message);
}
