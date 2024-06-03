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
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
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
    if (!userAddress) {
      toast({
        title: "Input Error",
        description: "Please enter a valid Ethereum address.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setLoading(true);  // Set loading to true when the function starts
    const config = {
      apiKey: import.meta.env.VITE_API_KEY,
      network: Network.ETH_MAINNET,
    };

    try {
      const alchemy = new Alchemy(config);
      const data = await alchemy.core.getTokenBalances(userAddress);
      setResults(data);

      const tokenDataPromises = data.tokenBalances.map(token =>
        alchemy.core.getTokenMetadata(token.contractAddress)
      );

      const tokenDataObjects = await Promise.all(tokenDataPromises);
      setTokenDataObjects(tokenDataObjects);
    } catch (error) {
      console.error("Failed to fetch token balances: ", error);
      toast({
        title: "Fetching Error",
        description: "Failed to fetch token balances.",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    } finally {
      setLoading(false);  // Ensure loading is set to false after operations complete
    }
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
        ) : hasQueried && results.tokenBalances.length > 0 ? (
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Token</Th>
                <Th>Symbol</Th>
                <Th isNumeric>Balance</Th>
              </Tr>
            </Thead>
            <Tbody>
              {results.tokenBalances.map((token, index) => (
                <Tr key={index}>
                  <Td>
                    <Flex align="center">
                      <Image src={tokenDataObjects[index]?.logo} boxSize="30px" mr={2} />
                      {tokenDataObjects[index]?.name}
                    </Flex>
                  </Td>
                  <Td>{tokenDataObjects[index]?.symbol}</Td>
                  <Td isNumeric>{parseFloat(Utils.formatUnits(token.tokenBalance, tokenDataObjects[index]?.decimals)).toFixed(2)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        ) : (
          <Text>No token balances found.</Text>
        )}
      </Flex>
    </Box>
  );
}

export default App;
