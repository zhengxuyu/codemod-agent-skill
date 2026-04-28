import { WagmiProvider } from 'wagmi';

function App() {
  return (
    <WagmiProvider config={config}>
      <MyApp />
    </WagmiProvider>
  );
}
