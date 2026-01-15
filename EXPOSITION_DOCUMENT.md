# Exposición: SmartRoyalty Protocol 🎵⛓️

Este documento está diseñado como apoyo detallado del proyecto **SmartRoyalty**. Está estructurado para explicar el "qué", "cómo" y "por qué" de cada parte del sistema.

---

## 1. Introducción y Propósito
**SmartRoyalty** es una solución de vanguardia que utiliza tecnología Blockchain para resolver uno de los problemas más antiguos de la industria musical: **la distribución justa y transparente de regalías.**

En el modelo tradicional, el dinero de las ventas de un álbum pasa por múltiples intermediarios antes de llegar a los creadores (productores, escritores, ingenieros). Con SmartRoyalty, el contrato inteligente actúa como el "tesorero" automatizado, distribuyendo los fondos en tiempo real y sin intervención humana.

---

## 2. Arquitectura de Alto Nivel
El sistema se divide en tres capas principales:

1.  **Frontend (Interfaz de Usuario):** Construido con **React 19** y **Vite**. Ofrece una experiencia visual premium (Glassmorphism) para artistas y fans. Utiliza `ethers.js` para la comunicación directa con la red blockchain sin necesidad de servidores intermedios.
2.  **Blockchain (Lógica de Negocio):** Ejecutamos Smart Contracts escritos en **Solidity** sobre una red compatible con EVM (como Hyperledger Besu o Hardhat). Aquí es donde vive la "verdad" financiera y los derechos de propiedad.
3.  **Almacenamiento Descentralizado (IPFS):** En lugar de guardar archivos pesados (MP3, imágenes) en la blockchain (que sería extremadamente costoso), guardamos estos activos en **IPFS** vía **Pinata**. Solo el "hash" (huella digital) del archivo se guarda en el contrato.

---

## 3. Módulos del Sistema (Explicación Técnica)

### 3.1. Smart Contracts (El Motor)
*   **`RoyaltyFactory.sol`**: Es la "fábrica" de contratos. Permite que cualquier artista despliegue su propio contrato de distribución. Mantiene un registro de todos los álbumes creados en la plataforma.
*   **`RoyaltyDistributor.sol`**: Es el corazón de cada lanzamiento.
    *   **Gestión de Splits**: Define qué porcentaje le corresponde a cada colaborador.
    *   **Venta Dual**: Maneja dos tipos de flujos de pago: Compras personales y Licencias comerciales.
    *   **Transparencia**: Cualquiera puede verificar el balance y cuánto se ha distribuido.

### 3.2. Frontend: `useBlockchain.js` (El Conector)
Este es el "cerebro" del lado del cliente. Sus funciones principales son:
*   **`fetchDistributors`**: Escanea la blockchain para encontrar todos los contratos de álbumes activos y recopila sus metadatos (nombre, artista, precio, balance).
*   **`purchaseAlbum`**: Gestiona la transacción de compra para fans, otorgando acceso permanente al streaming.
*   **`purchaseLicense`**: Un flujo especializado para empresas que compran derechos comerciales.
*   **`claimRoyalties`**: Permite a los artistas retirar su dinero acumulado en un click.

---

## 4. Flujos y Casos de Uso (CU)

### [CU1]: Registro y Lanzamiento de Álbum (Artista)
1.  **El Artista** entra al "Studio Wizard".
2.  Sube sus pistas de audio y la portada.
3.  **Proceso**: Los archivos se suben a IPFS -> Se obtiene un CID (Content Identifier).
4.  El artista define los precios y los porcentajes de split.
5.  **Acción**: Se llama a la `RoyaltyFactory` para desplegar el contrato `RoyaltyDistributor` en la red.
6.  **Resultado**: El álbum aparece instantáneamente en el Marketplace.

### [CU2]: Compra Personal vs. Comercial (Usuario/Empresa)
*   **Flujo Fan**: El usuario paga el `personalPrice`. El contrato marca su dirección como "autorizada". El frontend habilita el reproductor de audio.
*   **Flujo Comercial**: Una empresa paga el `commercialPrice`. El contrato emite un recibo digital oficial. El frontend permite descargar un certificado PDF con los hashes de la transacción como prueba legal de licencia.

### [CU3]: Distribución y Cobro (Colaboradores)
1.  Cada vez que entra un pago al contrato, este se suma al pozo común.
2.  **El Sistema**: No divide el dinero inmediatamente para ahorrar gas.
3.  **El Cobro**: El artista entra a su Dashboard, ve su balance acumulado.
4.  **Acción**: Ejecuta `release()`. El contrato calcula su porcentaje exacto y le envía los fondos instantáneamente a su wallet.

---

## 5. Pila Tecnológica (Tech Stack)

| Tecnología | Rol en el Proyecto |
| :--- | :--- |
| **Solidity** | Desarrollo de contratos inteligentes (Backend inmutable). |
| **React 19** | Framework de UI para una experiencia SPA veloz. |
| **Ethers.js v6** | Librería para interacción Web3 (firmar transacciones). |
| **Tailwind CSS** | Diseño visual receptivo y estética "Cyber-Dark". |
| **Pinata / IPFS** | Almacenamiento distribuido de los archivos multimedia. |
| **Hardhat** | Entorno de desarrollo, testing y despliegue local. |

---

## 6. Conclusión 
**SmartRoyalty** no es solo un Marketplace de música; es una herramienta de empoderamiento para creadores. Al eliminar la opacidad de los pagos y automatizar los acuerdos legales mediante código, estamos construyendo el futuro del entretenimiento descentralizado.

*"La música es de quien la crea, y el valor llega a quien lo merece."*


