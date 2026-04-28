import { erc20ABI } from 'wagmi';

const { data } = useContractRead({
  abi: erc20ABI,
  functionName: 'balanceOf',
});
