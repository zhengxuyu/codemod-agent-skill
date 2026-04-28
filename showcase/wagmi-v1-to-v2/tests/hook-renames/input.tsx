import { useContractRead, useContractWrite, useSwitchNetwork, useWaitForTransaction } from 'wagmi';

const { data } = useContractRead({
  address: '0x...',
  abi: myAbi,
  functionName: 'balanceOf',
});

const { write } = useContractWrite({
  address: '0x...',
  abi: myAbi,
  functionName: 'transfer',
});

const { switchNetwork } = useSwitchNetwork();
const { data: receipt } = useWaitForTransaction({ hash: txHash });
