# 🚀 K6 Performance Showcase

This repository was created as a **personal sandbox** to demonstrate how I design and execute **performance testing scenarios** using custom APIs built on **Firebase Functions** and **Firestore**.  
It’s not an official K6 project — the name is just symbolic and serves as an example environment for test automation.

---

## Overview

The main purpose of this repository is to provide **safe, private endpoints** to simulate different transaction types without depending on any external system or authorization process.  
By owning the full stack, I can freely execute performance and load tests (for example, using k6) without worrying about real data, permissions, or compliance issues.


## Functionality

The project contains a **single Firebase Function** called `saveTransaction`.  
This function allows the creation of **three types of simulated transactions**, all stored in a **Firestore** collection:

- CARD
- DEPOSITS
- ALECREDITS

## Security

The function uses **custom header-based authentication** to ensure that only authorized requests can access it.  
Credentials are stored in a local `.env` file (excluded via `.gitignore`), ensuring no secrets are exposed in the repository.

## ⚠️ Disclaimer

This repository:

- Is not affiliated with any organization.
- Does not represent production code or real transaction systems.
- Exists solely for testing and learning purposes. --> Very important to understand!

If you have any question about that. Ask me!
