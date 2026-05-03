# Demo Prerequisites Setup

## Overview
For this demo, you will need:
- Node.js
- npm 
- git

---

## Check if Node and npm are already installed

Open your terminal and run:

```bash
node -v
npm -v
````

* If you see version numbers, you are good to go.
* If not, follow the setup instructions below.

---

## Windows Users (Required)

You must install WSL2 and a Linux distribution (Ubuntu recommended) before installing Node.

Setup guide:
[https://oneuptime.com/blog/post/2026-03-02-ubuntu-wsl2-windows11-development/view](https://oneuptime.com/blog/post/2026-03-02-ubuntu-wsl2-windows11-development/view)

After installing, open your Ubuntu terminal and continue below.

---

## macOS and Linux Users

You can continue directly with the steps below.

---

## Install Node.js and npm using nvm 
using nvm (node version manager) is the best way to do it
### 1) Install nvm

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash
```

or

```bash
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash
```

---

### 2) Restart your terminal

This step is required before using nvm.

---

### 3) Install Node.js (LTS version)

```bash
nvm install --lts
```

---

### 4) Verify installation

```bash
node -v
npm -v
```

You should see version numbers (e.g., v20.x.x).

---

## Notes

* if these instructions dont work for you please check online resources to install node and npm in you machine


---

## Ready

Once Node.js and npm are installed, you are ready for the demo.



## hardhat chain ID

```bash
31337
```
