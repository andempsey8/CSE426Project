# Ballot

## Instructions

### 1. Compile and Deploy Smart Contract and run a Hardhat Node

**Terminal 1:**

```bash
cd CH05Ballot/Ballot
npm install
npm install @openzeppelin/contracts
npx hardhat compile
npx hardhat node

```

**Terminal 2:**

```bash
cd CH05Ballot/Ballot
npx hardhat ignition deploy ./ignition/modules/BlockTickets.ts --network localhost
```
This deploys the contract


**Note the deployment address from the output** - will be required

### 2. Setup The DApp

**Terminal 3:**

```bash
cd CH05Ballot/BallotDapp

```

1.  Open `CH05Ballot/BallotDapp/src/app.js`
    
2.  Update the fields address in the app.js:
    
    ```javascript
    this.ContractAddress = '5FbD...<fill in your deployed address>';    
    ```
    
3.  Install dependencies and start:
    
    ```bash
    npm install
    npm start
    
    ```
    
