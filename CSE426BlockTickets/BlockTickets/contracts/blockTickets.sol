// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

// NEW ─── YODA Token Interface ─────────────────────────────────────────────────
interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
}

contract BlockTickets is ERC721URIStorage, ReentrancyGuard {

    // ─── Counters (manual) ───────────────────────────────────────────────────

    uint256 private _eventIdCounter;
    uint256 private _tokenIdCounter;

    // NEW ─── YODA Token ───────────────────────────────────────────────────────
    IERC20 public yodaToken;

    // ─── Structs ─────────────────────────────────────────────────────────────

    struct Event {
        uint256 eventId;
        address creator;
        string  name;
        uint256 ticketPrice;
        uint256 maxResalePrice;
        uint16  royaltyBps;
        uint32  totalSupply;
        uint32  minted;
    }

    struct Listing {
        address seller;
        uint256 price;
        bool    active;
    }

    // ─── Storage ─────────────────────────────────────────────────────────────

    mapping(uint256 => Event)   public events;
    mapping(uint256 => uint256) public tokenEvent;
    mapping(uint256 => Listing) public listings;

    // ─── Events ──────────────────────────────────────────────────────────────

    event EventCreated(uint256 indexed eventId, address indexed creator);
    event TicketMinted(uint256 indexed tokenId, uint256 indexed eventId, address buyer);
    event TicketListed(uint256 indexed tokenId, address seller, uint256 price);
    event TicketSold(uint256 indexed tokenId, address from, address to, uint256 price);

    // NEW ─── Constructor ──────────────────────────────────────────────────────
    constructor(address _yodaTokenAddress) ERC721("BlockTickets", "BTIX") {
        yodaToken = IERC20(_yodaTokenAddress);
    }

    // ─── Event Creation ──────────────────────────────────────────────────────

    function createEvent(string calldata eventName, uint256 ticketPrice, uint256 maxResalePrice, uint16 royaltyBps, uint32 totalSupply) external returns (uint256 eventId) {
        require(totalSupply > 0, "Invalid supply");
        require(royaltyBps <= 5000, "Royalty too high");

        _eventIdCounter++;
        eventId = _eventIdCounter;

        events[eventId] = Event({
            eventId: eventId,
            creator: msg.sender,
            name: eventName,
            ticketPrice: ticketPrice,
            maxResalePrice: maxResalePrice,
            royaltyBps: royaltyBps,
            totalSupply: totalSupply,
            minted: 0
        });

        emit EventCreated(eventId, msg.sender);
    }

    // ─── Primary Sale ────────────────────────────────────────────────────────

    // NEW ─── removed payable, replaced msg.value with YODA transferFrom ───────
    function buyTicket(uint256 eventId) external nonReentrant {
        Event storage evt = events[eventId];

        require(evt.eventId != 0, "Invalid event");
        require(evt.minted < evt.totalSupply, "Sold out");

        // NEW ─── Pull YODA from buyer ─────────────────────────────────────────
        bool taken = yodaToken.transferFrom(msg.sender, address(this), evt.ticketPrice);
        require(taken, "YODA payment failed");

        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        evt.minted++;
        tokenEvent[tokenId] = eventId;

        _safeMint(msg.sender, tokenId);
        _setDynamicTokenURI(tokenId, evt);

        // NEW ─── Send YODA to creator ─────────────────────────────────────────
        _sendYODA(evt.creator, evt.ticketPrice);

        emit TicketMinted(tokenId, eventId, msg.sender);
    }

    // ─── Secondary Market ────────────────────────────────────────────────────

    function listTicket(uint256 tokenId, uint256 price) external {
        require(ownerOf(tokenId) == msg.sender, "Not owner");

        Event storage evt = events[tokenEvent[tokenId]];
        require(evt.maxResalePrice > 0, "Resale disabled");
        require(price <= evt.maxResalePrice, "Above cap");

        listings[tokenId] = Listing(msg.sender, price, true);

        emit TicketListed(tokenId, msg.sender, price);
    }

    // NEW ─── removed payable, replaced msg.value with YODA transferFrom ───────
    function buyListedTicket(uint256 tokenId) external nonReentrant {
        Listing storage listing = listings[tokenId];
        require(listing.active, "Not listed");

        Event storage evt = events[tokenEvent[tokenId]];

        address seller = listing.seller;
        uint256 price = listing.price;
        listing.active = false;

        // NEW ─── Pull YODA from buyer ─────────────────────────────────────────
        bool taken = yodaToken.transferFrom(msg.sender, address(this), price);
        require(taken, "YODA payment failed");

        uint256 royalty = (price * evt.royaltyBps) / 10000;
        uint256 sellerAmount = price - royalty;

        _transfer(seller, msg.sender, tokenId);

        // NEW ─── Split YODA to creator and seller ────────────────────────────
        _sendYODA(evt.creator, royalty);
        _sendYODA(seller, sellerAmount);

        emit TicketSold(tokenId, seller, msg.sender, price);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    // NEW ─── renamed from _sendETH ───────────────────────────────────────────
    function _sendYODA(address to, uint256 amount) internal {
        bool success = yodaToken.transfer(to, amount);
        require(success, "YODA transfer failed");
    }

    function _setDynamicTokenURI(uint256 tokenId, Event storage evt) internal {
        string memory json = string(
            abi.encodePacked(
                '{"name":"', evt.name,
                ' #', Strings.toString(tokenId),
                '","description":"Event ID: ', Strings.toString(evt.eventId),
                '","attributes":[{"trait_type":"Token ID","value":', Strings.toString(tokenId),
                '}]}'
            )
        );

        string memory encoded = Base64.encode(bytes(json));

        _setTokenURI(
            tokenId,
            string(abi.encodePacked("data:application/json;base64,", encoded))
        );
    }

    function getAllEvents() external view returns (Event[] memory) {
        uint256 count = _eventIdCounter;
        Event[] memory allEvents = new Event[](count);

        for (uint256 i = 1; i <= count; i++) {
            allEvents[i - 1] = events[i];
        }

        return allEvents;
    }

    function getAllListings() external view returns (uint256[] memory tokenIds, Listing[] memory allListings) {
        uint256 totalTokens = _tokenIdCounter;
        uint256 activeCount = 0;

        for (uint256 i = 1; i <= totalTokens; i++) {
            if (listings[i].active) activeCount++;
        }

        tokenIds = new uint256[](activeCount);
        allListings = new Listing[](activeCount);
        uint256 index = 0;

        for (uint256 i = 1; i <= totalTokens; i++) {
            if (listings[i].active) {
                tokenIds[index] = i;
                allListings[index] = listings[i];
                index++;
            }
        }
    }

    function getListing(uint256 tokenId) external view returns (address seller, uint256 price, bool active) {
        Listing storage listing = listings[tokenId];
        return (listing.seller, listing.price, listing.active);
    }
}