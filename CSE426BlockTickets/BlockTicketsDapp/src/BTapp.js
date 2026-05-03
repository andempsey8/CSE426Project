class App {
    constructor() {
        this.ContractAddress = "0x53fb7d01cb782A9A6a7f468E456d44059F28493E";
        this.AbiLocation = "./BlockTickets.json";
        this.ContractABI = null;
        this.signer = null;
        this.contract = null;
        this.walletConnected = false;
        this.userAddress = null;

        // NEW ─── YODA token setup ─────────────────────────────────────────────
        this.YodaAddress = "0xbd27d0b7F9fedb5A2A2C3ceF5dC9c70f3CF64Af2";
        this.YodaABI = [
            "function approve(address spender, uint256 amount) external returns (bool)",
            "function balanceOf(address account) external view returns (uint256)"
        ];
        this.yodaContract = null;
    }

    async loadABI() {
        try {
            const response = await fetch(this.AbiLocation);
            const data = await response.json();
            this.ContractABI = data.abi;
            console.log("ABI loaded successfully.", this.ContractABI);
        } catch (error) {
            console.error("Failed to load ABI:", error);
        }
    }

    async connectMetaMaskAndContract() {
        try {
            if (!window.ethereum) {
                alert("MetaMask not detected. Please install it.");
                return;
            }

            if (!this.ContractABI) {
                await this.loadABI();
            }

            const provider = new ethers.providers.Web3Provider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            this.signer = provider.getSigner();

            this.contract = new ethers.Contract(
                this.ContractAddress,
                this.ContractABI,
                this.signer
            );

            // NEW ─── Instantiate YODA contract ───────────────────────────────
            this.yodaContract = new ethers.Contract(
                this.YodaAddress,
                this.YodaABI,
                this.signer
            );

            this.walletConnected = true;
            this.userAddress = await this.signer.getAddress();

            document.getElementById("overlay").style.display = "none";

            console.log("Connected to MetaMask and contract successfully.");
            console.log("User Address:", this.userAddress);

            // NEW ─── Log YODA balance on connect ─────────────────────────────
            const yodaBalance = await this.yodaContract.balanceOf(this.userAddress);
            console.log("YODA Balance:", ethers.utils.formatEther(yodaBalance));

        } catch (error) {
            console.error("MetaMask connection failed:", error);
        }
    }

    /* ─────────────────────────────────────────────
       LOAD EVENTS FROM CONTRACT
    ───────────────────────────────────────────── */
    async loadEvents() {
        try {
            const events = await this.contract.getAllEvents();

            return events.map(e => ({
                id: e.eventId.toString(),
                name: e.name,
                price: ethers.utils.formatEther(e.ticketPrice),
                available: (e.totalSupply - e.minted).toString()
            }));

        } catch (err) {
            console.error("Error loading events:", err);
            return [];
        }
    }

    /* ─────────────────────────────────────────────
       LOAD MARKET LISTINGS
    ───────────────────────────────────────────── */
    async loadListings() {
        try {
            const [tokenIds, allListings] = await this.contract.getAllListings();
            let listings = [];

            for (let i = 0; i < tokenIds.length; i++) {
                const tokenId = tokenIds[i];
                const listing = allListings[i];

                const eventId = await this.contract.tokenEvent(tokenId);
                const evt = await this.contract.events(eventId);

                listings.push({
                    eventId: eventId.toString(),
                    name: evt.name,
                    ticketId: tokenId.toString(),
                    price: ethers.utils.formatEther(listing.price)
                });
            }

            return listings;

        } catch (err) {
            console.error("Error loading listings:", err);
            return [];
        }
    }

    /* ─────────────────────────────────────────────
       UI: HOME
    ───────────────────────────────────────────── */
    showHome() {
        document.getElementById("content").innerHTML = `
            <h2>Home</h2>
            <p>Welcome to Block Tickets. Connected as:</p>
            <p><b>${this.userAddress}</b></p>
        `;
    }

    /* ─────────────────────────────────────────────
       UI: EVENTS
    ───────────────────────────────────────────── */
    async showEvents() {
        const events = await this.loadEvents();

        // NEW ─── changed ETH label to YODA ───────────────────────────────────
        let html = `
            <h2>Available Events</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Price (YODA)</th>
                        <th>Available</th>
                    </tr>
                </thead>
                <tbody>
        `;

        events.forEach(e => {
            html += `
                <tr>
                    <td>${e.id}</td>
                    <td>${e.name}</td>
                    <td>${e.price}</td>
                    <td>${e.available}</td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        document.getElementById("content").innerHTML = html;
    }

    /* ─────────────────────────────────────────────
       UI: CREATE EVENT
    ───────────────────────────────────────────── */
    showCreateEvent() {
        // NEW ─── changed ETH labels to YODA ──────────────────────────────────
        document.getElementById("content").innerHTML = `
            <h2>Create Event</h2>

            <div class="form-grid">
                <div><label>Name</label><input id="eventName"/></div>
                <div><label>Ticket Price (YODA)</label><input id="ticketPrice"/></div>
                <div><label>Max Resale Price (YODA)</label><input id="maxResalePrice"/></div>
                <div><label>Royalty BPS</label><input id="royaltyBps"/></div>
                <div><label>Total Supply</label><input id="totalSupply"/></div>
            </div>

            <button onclick="submitEvent()">Create Event</button>
        `;
    }

    async createEvent() {
        try {
            const tx = await this.contract.createEvent(
                document.getElementById("eventName").value,
                ethers.utils.parseUnits(document.getElementById("ticketPrice").value, 2),
                ethers.utils.parseUnits(document.getElementById("maxResalePrice").value, 2),
                document.getElementById("royaltyBps").value,
                document.getElementById("totalSupply").value
            );

            await tx.wait();
            alert("Event created!");

        } catch (err) {
            console.error(err);
            alert("Error creating event");
        }
    }

    /* ─────────────────────────────────────────────
       BUY TICKET
    ───────────────────────────────────────────── */
    showBuyTicket() {
        document.getElementById("content").innerHTML = `
            <h2>Buy Ticket</h2>

            <div class="form-grid">
                <div><label>Event ID</label><input id="buyEventId"/></div>
            </div>

            <button onclick="submitBuy()">Buy Ticket</button>
        `;
    }

    async buyTicket() {
        try {
            const eventId = document.getElementById("buyEventId").value;
            const evt = await this.contract.events(eventId);

            // NEW ─── Approve YODA spend before buying ────────────────────────
            const approveTx = await this.yodaContract.approve(
                this.ContractAddress,
                evt.ticketPrice
            );
            await approveTx.wait();

            // NEW ─── No longer passing { value: ... } ────────────────────────
            const tx = await this.contract.buyTicket(eventId);
            await tx.wait();
            alert("Ticket purchased!");

        } catch (err) {
            console.error(err);
            alert("Error buying ticket");
        }
    }

    /* ─────────────────────────────────────────────
       SELL TICKET
    ───────────────────────────────────────────── */
    showSellTicket() {
        // NEW ─── changed ETH label to YODA ───────────────────────────────────
        document.getElementById("content").innerHTML = `
            <h2>Sell Ticket</h2>

            <div class="form-grid">
                <div><label>Token ID</label><input id="ticketId"/></div>
                <div><label>Price (YODA)</label><input id="sellPrice"/></div>
            </div>

            <button onclick="submitSell()">Sell Ticket</button>
        `;
    }

    async sellTicket() {
        try {
            const tx = await this.contract.listTicket(
                document.getElementById("ticketId").value,
                ethers.utils.parseUnits(document.getElementById("sellPrice").value, 2)
            );

            await tx.wait();
            alert("Ticket listed!");

        } catch (err) {
            console.error(err);
            alert("Error listing ticket");
        }
    }

    /* ─────────────────────────────────────────────
       MARKET
    ───────────────────────────────────────────── */
    async showMarket() {
        const listings = await this.loadListings();

        // NEW ─── changed ETH label to YODA ───────────────────────────────────
        let html = `
            <h2>Market</h2>

            <div class="form-grid">
                <div>
                    <label>Token ID</label>
                    <input id="marketTokenId"/>
                </div>
            </div>

            <button onclick="submitMarket()">Buy Listed Ticket</button>

            <table>
                <thead>
                    <tr>
                        <th>Event</th>
                        <th>Ticket ID</th>
                        <th>Price (YODA)</th>
                    </tr>
                </thead>
                <tbody>
        `;

        listings.forEach(l => {
            html += `
                <tr>
                    <td>${l.name}</td>
                    <td>${l.ticketId}</td>
                    <td>${l.price}</td>
                </tr>
            `;
        });

        html += `</tbody></table>`;
        document.getElementById("content").innerHTML = html;
    }

    async buyFromMarket() {
        try {
            const tokenId = document.getElementById("marketTokenId").value;
            const listing = await this.contract.listings(tokenId);

            // NEW ─── Approve YODA spend before buying ────────────────────────
            const approveTx = await this.yodaContract.approve(
                this.ContractAddress,
                listing.price
            );
            await approveTx.wait();

            // NEW ─── No longer passing { value: ... } ────────────────────────
            const tx = await this.contract.buyListedTicket(tokenId);
            await tx.wait();
            alert("Ticket purchased!");

        } catch (err) {
            console.error(err);
            alert("Error buying from market");
        }
    }
}

/* ─────────────────────────────────────────────
   INIT + GLOBAL HOOKS
──────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", async () => {
    window.app = new App();
    await window.app.connectMetaMaskAndContract();

    window.showHome = () => window.app.showHome();
    window.showEvents = () => window.app.showEvents();
    window.showCreateEvent = () => window.app.showCreateEvent();
    window.showBuyTicket = () => window.app.showBuyTicket();
    window.showSellTicket = () => window.app.showSellTicket();
    window.showMarket = () => window.app.showMarket();

    window.submitEvent = () => window.app.createEvent();
    window.submitBuy = () => window.app.buyTicket();
    window.submitSell = () => window.app.sellTicket();
    window.submitMarket = () => window.app.buyFromMarket();

    window.app.showHome();
});