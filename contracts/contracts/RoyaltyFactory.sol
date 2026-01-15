
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./RoyaltyDistributor.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RoyaltyFactory
 * @dev Fábrica para crear e implementar contratos RoyaltyDistributor.
 * Permite a los artistas desplegar su propia infraestructura de pagos sin programar.
 */
contract RoyaltyFactory is Ownable {
    // Evento emitido cada vez que se crea un nuevo contrato de álbum
    event RoyaltyContractCreated(address indexed contractAddress, string albumName, address indexed creator);

    // Lista de todos los contratos de distribución desplegados por esta fábrica
    RoyaltyDistributor[] public deployedContracts;

    constructor() Ownable() {}

    /**
     * @dev Crea y despliega una nueva instancia de RoyaltyDistributor.
     * @param albumName Nombre del álbum o lanzamiento.
     * @param artistName Nombre del artista principal.
     * @param musicCID Identificador IPFS de los archivos de audio.
     * @param coverCID Identificador IPFS de la portada.
     * @param albumPrice Precio para uso personal (streaming/descarga).
     * @param commercialPrice Precio para licencias de uso comercial.
     * @param payees Lista de direcciones de los colaboradores que recibirán pagos.
     * @param shares_ Lista de porcentajes/partes asignadas a cada colaborador.
     */
    function createRoyaltyDistributor(
        string memory albumName,
        string memory artistName,
        string memory musicCID,
        string memory coverCID,
        uint256 albumPrice,
        uint256 commercialPrice,
        address[] memory payees,
        uint256[] memory shares_
    ) public returns (address) {
        // Despliegue del nuevo contrato inteligente
        RoyaltyDistributor newContract = new RoyaltyDistributor(
            albumName,
            artistName,
            musicCID,
            coverCID,
            albumPrice,
            commercialPrice,
            payees,
            shares_
        );

        // Guardar la dirección en el registro global de la fábrica
        deployedContracts.push(newContract);
        
        // Notificar a la red sobre la creación del contrato
        emit RoyaltyContractCreated(address(newContract), albumName, msg.sender);
        
        return address(newContract);
    }

    /**
     * @dev Retorna la lista completa de contratos creados.
     */
    function getDeployedContracts() public view returns (RoyaltyDistributor[] memory) {
        return deployedContracts;
    }
}
