import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Image,
  Input,
  SimpleGrid,
  Text,
  useToast,
  Spinner,
  useColorModeValue,
} from '@chakra-ui/react';
import { Alchemy, Network, Utils } from 'alchemy-sdk';
import { useState } from 'react';
import { ethers } from 'ethers';

function App() {
  const [connected, setConnected] = useState(false);
  const [userAddress, setUserAddress] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasQueried, setHasQueried] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);
  const toast = useToast();

  // Function to connect/disconnect the wallet
  async function connectWallet() {
    if (!connected) {
      try {
        // Connect the wallet using ethers.js
        const provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []); // Request access to the user's accounts
        const signer = await provider.getSigner();
        const _walletAddress = await signer.getAddress();
        setConnected(true);
        setUserAddress(_walletAddress);
        toast({
          title: "Connected",
          description: "Wallet connected successfully.",
          status: "success",
          duration: 5000,
          isClosable: true,
          position: "top-right",
        });
      } catch (error) {
        console.error("Error connecting to wallet: ", error);
        toast({
          title: "Connection Error",
          description: "Failed to connect the wallet.",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "top-right",
        });
      }
    } else {
      // Disconnect the wallet
      setConnected(false);
      setUserAddress("");
      toast({
        title: "Disconnected",
        description: "Wallet disconnected.",
        status: "info",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    }
  }

  async function getTokenBalance() {
    const config = {
      apiKey: import.meta.env.VITE_API_KEY,
      network: Network.ETH_MAINNET,
    };

    const alchemy = new Alchemy(config);
    const data = await alchemy.core.getTokenBalances(userAddress);

    setResults(data);

    const tokenDataPromises = [];

    for (let i = 0; i < data.tokenBalances.length; i++) {
      const tokenData = alchemy.core.getTokenMetadata(
        data.tokenBalances[i].contractAddress
      );
      tokenDataPromises.push(tokenData);
    }

    setTokenDataObjects(await Promise.all(tokenDataPromises));
    setHasQueried(true);
  }
  return (
    <Box w="100vw" p={5} bg={useColorModeValue('gray.50', 'gray.900')}>
      <Center>
        <Flex
          alignItems={'center'}
          justifyContent="center"
          flexDirection={'column'}
        >
          <Heading mb={4} fontSize={36}>
            ERC-20 Token Indexer
          </Heading>
          <Text fontSize="lg" mb={4}>
            Connect your wallet to check all your ERC-20 token balances.
          </Text>
          <Button colorScheme={connected ? "red" : "teal"} onClick={connectWallet}>
            {connected ? "Disconnect Wallet" : "Connect Wallet"}
          </Button>
          {userAddress && <Text mt={2}>Connected Address: {userAddress}</Text>}
        </Flex>
      </Center>
      <Flex
        w="100%"
        flexDirection="column"
        alignItems="center"
        justifyContent={'center'}
      >
        <Heading mt={42} mb={6}>
          Get all the ERC-20 token balances of this address:
        </Heading>
        <Input
          value={userAddress}
          onChange={(e) => setUserAddress(e.target.value)}
          color="black"
          w="600px"
          textAlign="center"
          p={4}
          bgColor="white"
          fontSize={24}
        />
        <Button fontSize={20} onClick={getTokenBalance} mt={4} bgColor="teal" isLoading={loading} loadingText="Checking Balances">
          Check ERC-20 Token Balances
        </Button>

        <Heading my={12}>ERC-20 token balances:</Heading>

        {loading ? (
          <Spinner size="xl" />
        ) : (
          <SimpleGrid columns={3} spacing={4} p={4} w="full">
            {results.tokenBalances.map((e, i) => (
              <Flex flexDirection={'column'} bg="blue.600" color="white" p={3} borderRadius="md" key={i}>
                <Image src={tokenDataObjects[i]?.logo} boxSize="50px" alt={tokenDataObjects[i]?.name} />
                <Text fontWeight="bold">{tokenDataObjects[i]?.symbol}</Text>
                <Text>Balance: {Utils.formatUnits(e.tokenBalance, tokenDataObjects[i]?.decimals)}</Text>
              </Flex>
            ))}
          </SimpleGrid>
        )}
      </Flex>
    </Box>
  );
}

export default App;
