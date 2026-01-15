
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/finance/PaymentSplitter.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title RoyaltyDistributor
 * @dev Maneja la venta de álbumes y la distribución automática de ingresos entre colaboradores.
 * Hereda de PaymentSplitter para un reparto justo y seguro de fondos.
 */
contract RoyaltyDistributor is PaymentSplitter, ReentrancyGuard {
    // Metadatos del álbum almacenados en la blockchain
    string public albumName;
    string public artistName;
    string public musicCID; // Hash de IPFS para los archivos de audio
    string public coverCID; // Hash de IPFS para el arte de portada
    uint256 public albumPrice; // Precio para acceso personal
    uint256 public commercialPrice; // Precio para licencia de uso comercial
    
    address[] private _allPayees; // Lista interna de beneficiarios
    mapping(address => bool) public purchasers; // Registro de compradores personales
    mapping(address => bool) public commercialLicenses; // Registro de dueños de derechos comerciales

    event AlbumPurchased(address indexed buyer, uint256 amount);
    event LicensePurchased(address indexed buyer, uint256 amount);

    constructor(
        string memory _albumName,
        string memory _artistName,
        string memory _musicCID,
        string memory _coverCID,
        uint256 _albumPrice,
        uint256 _commercialPrice,
        address[] memory payees,
        uint256[] memory shares_
    ) PaymentSplitter(payees, shares_) payable {
        albumName = _albumName;
        artistName = _artistName;
        musicCID = _musicCID;
        coverCID = _coverCID;
        albumPrice = _albumPrice;
        commercialPrice = _commercialPrice;
        _allPayees = payees;
    }

    /**
     * @dev Permite a un usuario comprar el álbum para uso personal.
     * Al recibir el pago, distribuye los fondos automáticamente entre los colaboradores.
     */
    function purchaseAlbum() external payable {
        require(msg.value >= albumPrice, "Marketplace: Fondos insuficientes");
        require(!purchasers[msg.sender], "Marketplace: El album ya fue comprado por esta cuenta");
        
        purchasers[msg.sender] = true;
        
        // Lógica de Pago Automático (Modelo Push)
        // Libera los fondos inmediatamente a todos los colaboradores
        for (uint256 i = 0; i < _allPayees.length; i++) {
            release(payable(_allPayees[i]));
        }

        emit AlbumPurchased(msg.sender, msg.value);
    }

    /**
     * @dev Permite a una entidad comprar una licencia de uso comercial.
     * Otorga derechos comerciales y también acceso personal si no lo tenía.
     */
    function purchaseLicense() external payable {
        require(msg.value >= commercialPrice, "Marketplace: Fondos insuficientes para licencia");
        require(!commercialLicenses[msg.sender], "Marketplace: Licencia ya adquirida");
        
        commercialLicenses[msg.sender] = true;
        
        // Otorgar acceso personal si es la primera vez que interactúa
        if(!purchasers[msg.sender]) {
            purchasers[msg.sender] = true;
        }
        
        // Distribución automática de los fondos de la licencia
        for (uint256 i = 0; i < _allPayees.length; i++) {
            release(payable(_allPayees[i]));
        }

        emit LicensePurchased(msg.sender, msg.value);
    }

    /**
     * @dev Verifica si una dirección tiene acceso al contenido.
     */
    function hasPurchased(address _account) public view returns (bool) {
        if (albumPrice == 0) return true; // Contenido gratuito
        return purchasers[_account];
    }
}
