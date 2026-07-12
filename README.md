# Dual-Blockchain e-Voting Project

![Node.js](https://img.shields.io/badge/Node.js-v24%2B-green?style=flat-square&logo=node.js)
![Next.js](https://img.shields.io/badge/Next.js-v14-black?style=flat-square&logo=next.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?style=flat-square&logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

This project implements a **dual-blockchain electronic voting** system, developed for the "Software Engineering" course at the Polytechnic University of Bari.

##  Authors
*   **Gabriele G. Sannicandro**
*   **Marco Valvetri**
*   **Davide Scarabaggio**
*   **Angelo F. Manfredi**

##  References
*    [Enhancing Electronic Voting With A Dual-Blockchain Architecture](https://www.researchgate.net/publication/350211290_Enhancing_Electronic_Voting_With_A_Dual-Blockchain_Architecture)
*    [Dual blockchain-based data sharing mechanism with privacy protection for medical internet of things](https://www.researchgate.net/publication/376383270_Dual_blockchain-based_data_sharing_mechanism_with_privacy_protection_for_medical_internet_of_things)

---

## <a name="introduzione"></a>Introduction
The application allows administrators to create elections and manage candidates, and students to vote securely, ensuring vote anonymity and integrity through a dual-blockchain system.

---

## <a name="installazione-e-avvio-docker"></a>Installation and Startup

###  Prerequisites
*   **Docker** and **Node.js**

###  Starting the System
1.  Clone the repository and move to the project root.
2.  Create the `.env` file if it does not exist, configuring the required variables.
3.  Start the application:
    ```bash
    docker-compose up --build
    ```

###  Deploying factory contracts to the blockchains
With all containers running, execute the following command in a **bash shell** from the project root to deploy the factories:

```bash
./factories.sh
```

###  Accessing the Services
You can access the various services at the following addresses:
*   **Student Frontend**: [http://localhost:3000](http://localhost:3000/student)
*   **Admin Frontend**: [http://localhost:3000](http://localhost:3000/admin)
*   **Backend API**: [http://localhost:3001](http://localhost:3001)
*   **System health status (via API call)**: [http://localhost:3001/api/health](http://localhost:3001/api/health)
*   **Authentication blockchain (via API call)**: [http://localhost:8545](http://localhost:8545)
*   **Votes blockchain (via API call)**: [http://localhost:8546](http://localhost:8546)
*   **MailHog**: [http://localhost:8025](http://localhost:8025) To view the sent OTP codes
*   **pgAdmin**: [http://localhost:5050](http://localhost:5050) username: `admin@admin.com` password: `admin` database password: `mypassword`

---

## <a name="testing-e-utilizzo"></a>Testing and Usage

### Admin Login Credentials
*   **Username**: `admin`
*   **Password**: `admin`

**Note**: To populate the voter list, when creating an election, upload a CSV file from the `demo` folder (for example, `whitelist_25.csv`).
