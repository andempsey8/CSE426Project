# Ballot

## Instructions

### 1. Compile and Deploy Smart Contract and run a Hardhat Node

**Terminal 1:**

```bash
cd CSE426BlockTickets/BlockTickets
npm install
npm install @openzeppelin/contracts
npx hardhat compile
npx hardhat node

```

**Terminal 2:**

```bash
cd CSE426BlockTickets/BlockTickets
npx hardhat ignition deploy ./ignition/modules/BlockTickets.ts --network localhost
```
This deploys the contract


**Note the deployment address from the output** - will be required

### 2. Setup The DApp

**Terminal 3:**

```bash
cd CSE426BlockTickets/BlockTicketsDapp

```

1.  Open `CSE426BlockTickets/BlockTicketsDapp/src/BTapp.js`
    
2.  Update the fields address in the BTapp.js:
    
    ```javascript
    this.ContractAddress = '5FbD...<fill in your deployed address>';    
    ```
    
3.  Install dependencies and start:
    
    ```bash
    npm install
    npm start
    
    ```
    
