import * as Network from 'expo-network';

async function isOnline() {
  const networkState = await Network.getNetworkStateAsync();
  return networkState.isConnected && networkState.isInternetReachable;
}

export default isOnline;
