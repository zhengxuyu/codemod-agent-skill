import { useReadContract, useWriteContract, useSwitchChain, useWaitForTransactionReceipt } from 'wagmi';

const { data } = useReadContract({
  address: '0x...',
  abi: myAbi,
  functionName: 'balanceOf',
});

const { write } = useWriteContract({
  address: '0x...',
  abi: myAbi,
  functionName: 'transfer',
});

const { switchNetwork } = useSwitchChain();
const { data: receipt } = useWaitForTransactionReceipt({ hash: txHash });
