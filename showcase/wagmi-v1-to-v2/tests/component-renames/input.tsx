import { WagmiConfig } from 'wagmi';

function App() {
  return (
    <WagmiConfig config={config}>
      <MyApp />
    </WagmiConfig>
  );
}
