import { erc20Abi } from 'wagmi';

const { data } = useReadContract({
  abi: erc20Abi,
  functionName: 'balanceOf',
});
