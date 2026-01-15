# Documentación Técnica: SmartRoyalty Protocol

## 1. Resumen Ejecutivo
SmartRoyalty es una plataforma descentralizada (DApp) construida sobre la red **Hyperledger Besu** (o compatible con EVM) que revoluciona la distribución de música y royalties. Permite a los artistas "tokenizar" sus álbumes y pistas maestras, asegurando que los ingresos por ventas se distribuyan automáticamente y de manera transparente entre todos los colaboradores (productores, vocalistas, compositores) mediante Smart Contracts.

### Características Clave
*   **Gestión de Álbumes Multi-Pista**: Carga de LPs completos con metadatos estructurados.
*   **Distribución Automática de Royalties**: Split de pagos en tiempo real en la blockchain.
*   **Licenciamiento Comercial (B2B)**: Venta de derechos de uso para creadores y empresas a un precio premium.
*   **Almacenamiento Descentralizado**: Uso de IPFS (Pinata) para audios y arte, garantizando inmutabilidad.
*   **Marketplace Global**: Interfaz para fans y licenciatarios.
*   **Reproductor Premium**: Experiencia de escucha de alta fidelidad integrada.

---

## 2. Pila Tecnológica (Tech Stack)

### Frontend (Cliente)
*   **Framework**: React 19 (Vite)
*   **Lenguaje**: JavaScript (ES6+)
*   **Estilos**: Tailwind CSS + Animaciones CSS personalizadas (Glassmorphism).
*   **Web3 Integration**: `ethers.js v6` para comunicarse con la blockchain.
*   **IPFS**: Integración API con Pinata para gestión de archivos.

### Backend (Blockchain)
*   **Red**: Hyperledger Besu (Red Privada/Consorcio) o Hardhat Network (Desarrollo).
*   **Lenguaje**: Solidity ^0.8.0.
*   **Contratos Principales**:
    *   `RoyaltyFactory.sol`: Gestor y desplegador de nuevos contratos de distribución.
    *   `RoyaltyDistributor.sol`: Contrato individual por álbum que maneja la lógica de venta y split.
*   **Herramientas**: Hardhat (Compilación, Testing, Scripts de despliegue).

---

## 3. Diagramas de Caso de Uso (UML)

El sistema integra tres actores: **Artista**, **Fan (Consumidor)** y **Licenciatario (Comercial)**.

```mermaid
graph LR
    subgraph Actores
        A[Artista]
        F[Fan / Coleccionista]
        B[Licenciatario Comercial]
    end

    subgraph "Release Studio"
        UC1([Crear Álbum])
        UC2([Definir Precios])
        UC4([Desplegar Contrato])
    end

    subgraph "Marketplace"
        UC7([Comprar Álbum])
        UC11([Adquirir Licencia])
        UC12([Descargar Certificado])
    end

    subgraph "Dashboard"
        UC9([Reclamar Royalties])
    end

    A --- UC1
    A --- UC2
    A --- UC4
    A --- UC9

    F --- UC7
    
    B --- UC11
    B --- UC12
```

---

## 4. Modelo de Entidad-Relación (ERS) y Flujo de Datos

Dado que es una DApp, la data reside híbrida entre la Blockchain (datos críticos financieros) e IPFS (datos pesados multimedia).

### Diagrama de Estructura de Datos

```mermaid
erDiagram
    FACTORY_CONTRACT ||--|{ ALBUM_CONTRACT : "despliega"
    
    ALBUM_CONTRACT {
        address owner
        string name
        uint256 personalPrice
        uint256 commercialPrice
        bytes32 musicCID
        mapping licenses
    }

    IPFS_METADATA {
        string version
        string type
        string name
        Track[] tracks
    }

    LICENSE_NFT {
        address licensee
        uint256 timestamp
        string type
    }

    ALBUM_CONTRACT ||--|| IPFS_METADATA : "apunta a"
    ALBUM_CONTRACT ||--|{ LICENSE_NFT : "emite"
```

### Diccionario de Datos

1.  **On-Chain (Smart Contract)**:
    *   `personalPrice`: Costo para usuarios comunes (streaming/download).
    *   `commercialPrice`: Costo para empresas (derecho de uso en media).
    *   `purchases`: Registro de compradores personales.
    *   `commercialLicenses`: Mapping de direcciones que poseen derechos comerciales.

2.  **Off-Chain (IPFS JSON Manifest)**:
    *   `tracks`: Array de objetos con títulos y hashes de audio.

---

## 5. Arquitectura del Sistema (Flujo de Compra Dual)

```mermaid
sequenceDiagram
    participant user as Usuario
    participant ui as Frontend
    participant bc as Blockchain
    
    user->>ui: Selecciona Álbum
    ui->>user: ¿Tipo de Compra?
    
    alt Uso Personal
        user->>ui: Paga Precio Personal (ej. 0.01 ETH)
        ui->>bc: purchaseAlbum()
        bc-->>ui: Grant Access (Stream)
    else Licencia Comercial
        user->>ui: Paga Precio Comercial (ej. 0.5 ETH)
        ui->>bc: purchaseLicense()
        bc-->>ui: Mint License NFT
        ui->>user: Generar Certificado PDF
    end
```

---

## 6. Manual de Despliegue y Ejecución

Sigue estos pasos para levantar el entorno de desarrollo completo.

### Prerrequisitos
*   **Node.js** (v18+)
*   **Git**
*   **MetaMask** (Extensión de navegador) configurado para red local.

### Paso 1: Configuración del Backend (Blockchain)

Navega a la carpeta de contratos:
```bash
cd contracts
```

Instala las dependencias:
```bash
npm install
```

Inicia una red local de Hardhat (simulando la blockchain):
```bash
npx hardhat node
```
*Mantén esta terminal abierta. Verás una lista de cuentas de prueba con ETH.*

En **otra terminal**, despliega el contrato fábrica (`RoyaltyFactory`) a la red local:
```bash
cd contracts
npx hardhat run scripts/deploy.js --network localhost
```
*Copia la dirección del contrato desplegado (ej. `0x5FbDB...`).*

### Paso 2: Configuración del Frontend

Navega a la carpeta del frontend:
```bash
cd frontend
```

Instala las dependencias:
```bash
npm install
```

Configura las variables de entorno:
Crea un archivo `.env` en `frontend/`:
```env
VITE_PINATA_JWT=tu_token_jwt_de_pinata_aqui
```
*Necesitas una cuenta gratuita en Pinata Cloud para obtener este token.*

Actualiza la dirección del contrato (`FACTORY_ADDRESS`) en `frontend/src/lib/constants.js` si cambió respecto a la versión anterior.

Inicia el servidor de desarrollo:
```bash
npm run dev
```

### Paso 3: Uso de la Aplicación

1.  Abre `http://localhost:5173` en tu navegador.
2.  Conecta tu **MetaMask**. Asegúrate de estar conectado a `Localhost 8545` (Chain ID 31337).
    *   *Tip*: Importa una de las claves privadas que te dio `npx hardhat node` para tener ETH de prueba.
3.  Ve a **"Release Studio"**.
4.  Carga un título, artista, precio y sube tus tracks y portada.
5.  Haz clic en **"Deploy to Blockchain"**.
6.  Ve al **"Marketplace"** para ver y comprar tu álbum.

---

## 8. Explicación Detallada de Módulos y Código

### 8.1. Contrato Fábrica (`RoyaltyFactory.sol`)
Este módulo es el punto de entrada para la creación de nuevos activos en la red.
- **Función `createRoyaltyDistributor`**: Actúa como un *template manager*. Al llamarla, despliega una nueva instancia de `RoyaltyDistributor` pasando los parámetros del álbum (nombre, artista, precio, etc.).
- **Almacenamiento**: Mantiene un `address[] public deployedContracts` que permite al frontend iterar y mostrar todos los álbumes existentes sin necesidad de una base de datos centralizada.

### 8.2. Contrato de Distribución (`RoyaltyDistributor.sol`)
Este es el componente más crítico. Hereda de `PaymentSplitter` de OpenZeppelin, lo que garantiza que la lógica de reparto de dinero sea segura y auditada.
- **Lógica de Ventas**: Define funciones como `purchaseAlbum()` que verifican que el pago coincida con el precio establecido antes de otorgar permisos.
- **Gestión de Licencias**: Mantiene un registro (`mapping`) de quién ha comprado derechos comerciales, emitiendo eventos que el frontend captura para generar certificados.

### 8.3. Hook de Conexión (`useBlockchain.js`)
Es la capa de abstracción entre React y la Blockchain.
- **Sincronización de Estado**: Utiliza `useEffect` y `useCallback` para mantener la UI actualizada con los últimos saldos y eventos de la red.
- **Manejo de Proveedores**: Detecta automáticamente si el usuario tiene MetaMask (u otro wallet) inyectado en el navegador.

---

## 9. Flujo de Funcionamiento (Casos de Uso)

### Caso de Uso: Lanzamiento de Contenido (Artista)
*   **Actor**: Artista.
*   **Pre-condición**: Tener archivos de audio y wallet con fondos para gas.
1.  El artista interactúa con el **Studio Wizard**.
2.  El sistema sube los archivos a **Pinata (IPFS)**.
3.  El artista confirma la transacción de despliegue.
4.  **Resultado**: Se crea un nuevo Smart Contract inmutable que gestionará sus ingresos para siempre.

### Caso de Uso: Adquisición de Licencia (Empresa/B2B)
*   **Actor**: Licenciatario Comercial.
1.  Busca un álbum en el **Marketplace**.
2.  Selecciona la opción "Commercial License".
3.  El sistema calcula el precio premium y solicita la firma del pago.
4.  Al confirmarse, la Blockchain emite un evento de "LicensePurchased".
5.  El frontend genera un **Certificado Digital de Autenticidad** único.

---

## 10. Conclusiones y Recomendaciones para la Exposición
Al presentar el proyecto, se recomienda enfatizar:
1.  **Inmutabilidad**: Una vez que el álbum está en la red, nadie (ni siquiera los desarrolladores) puede cambiar los porcentajes de pago.
2.  **Descentralización**: La aplicación funciona 24/7 sin servidores centrales.
3.  **Transparencia**: El balance de ventas es público y auditable por cualquier colaborador.

*Actualizado por Antigravity AI - Enero 2026*
