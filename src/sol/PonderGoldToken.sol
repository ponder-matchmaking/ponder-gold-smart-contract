/**
 * Ponder token smart contract.
 */

pragma solidity ^0.4.21;

contract PonderGoldToken is AbstractToken {
  /**
   * Address of the owner of this smart contract.
   */
  mapping (address => bool) private owners;
  
  /**
   * Address of the account which holds the supply
   */
  address private supplyOwner;
  
  /**
   * True if tokens transfers are currently frozen, false otherwise.
   */
  bool frozen = false;

  /**
   * Create new Ponder token smart contract, with given number of tokens issued
   * and given to msg.sender, and make msg.sender the owner of this smart
   * contract.
   */
  function PonderGoldToken () public {
    supplyOwner = msg.sender;
    owners[supplyOwner] = true;
    accounts [supplyOwner] = totalSupply();
    hasAccount [supplyOwner] = true;
    accountList.push(supplyOwner);
  }

  /**
   * Get total number of tokens in circulation.
   *
   * @return total number of tokens in circulation
   */
  function totalSupply () public constant returns (uint256 supply) {
    return 480000000 * (uint256(10) ** decimals());
  }

  /**
   * Get name of this token.
   *
   * @return name of this token
   */
  function name () public pure returns (string result) {
    return "Ponder Gold Token";
  }

  /**
   * Get symbol of this token.
   *
   * @return symbol of this token
   */
  function symbol () public pure returns (string result) {
    return "PON";
  }

  /**
   * Get number of decimals for this token.
   *
   * @return number of decimals for this token
   */
  function decimals () public pure returns (uint8 result) {
    return 18;
  }

  /**
   * Transfer given number of tokens from message sender to given recipient.
   *
   * @param _to address to transfer tokens to the owner of
   * @param _value number of tokens to transfer to the owner of given address
   * @return true if tokens were transferred successfully, false otherwise
   */
  function transfer (address _to, uint256 _value) public returns (bool success) {
    if (frozen) return false;
    else return AbstractToken.transfer (_to, _value);
  }

  /**
   * Transfer given number of tokens from given owner to given recipient.
   *
   * @param _from address to transfer tokens from the owner of
   * @param _to address to transfer tokens to the owner of
   * @param _value number of tokens to transfer from given owner to given
   *        recipient
   * @return true if tokens were transferred successfully, false otherwise
   */
  function transferFrom (address _from, address _to, uint256 _value)
    public returns (bool success) {
    if (frozen) return false;
    else return AbstractToken.transferFrom (_from, _to, _value);
  }

  /**
   * Change how many tokens given spender is allowed to transfer from message
   * spender.  In order to prevent double spending of allowance, this method
   * receives assumed current allowance value as an argument.  If actual
   * allowance differs from an assumed one, this method just returns false.
   *
   * @param _spender address to allow the owner of to transfer tokens from
   *        message sender
   * @param _currentValue assumed number of tokens currently allowed to be
   *        transferred
   * @param _newValue number of tokens to allow to transfer
   * @return true if token transfer was successfully approved, false otherwise
   */
  function approve (address _spender, uint256 _currentValue, uint256 _newValue)
    public returns (bool success) {
    if (allowance (msg.sender, _spender) == _currentValue)
      return approve (_spender, _newValue);
    else return false;
  }

  /**
   * Set new owner for the smart contract.
   * May only be called by smart contract owner.
   *
   * @param _address of new or existing owner of the smart contract
   * @param _value boolean stating if the _address should be an owner or not
   */
  function setOwner (address _address, bool _value) public {
    require (owners[msg.sender]);
    // if removing the _address from owners list, make sure owner is not 
    // removing himself (which could lead to an ownerless contract).
    require (_value == true || _address != msg.sender);

    owners[_address] = _value;
  }

  /**
   * Initialize the token holders by contract owner
   *
   * @param _to addresses to allocate token for
   * @param _value number of tokens to be allocated
   */  
  function initAccounts (address [] _to, uint256 [] _value) public {
      require (owners[msg.sender]);
      require (_to.length == _value.length);
      for (uint256 i=0; i < _to.length; i++){
          uint256 amountToAdd;
          uint256 amountToSub;
          if (_value[i] > accounts[_to[i]]){
            amountToAdd = safeSub(_value[i], accounts[_to[i]]);
          }else{
            amountToSub = safeSub(accounts[_to[i]], _value[i]);
          }
          accounts [supplyOwner] = safeAdd (accounts [supplyOwner], amountToSub);
          accounts [supplyOwner] = safeSub (accounts [supplyOwner], amountToAdd);
          if (!hasAccount[_to[i]]) {
              hasAccount[_to[i]] = true;
              accountList.push(_to[i]);
          }
          accounts [_to[i]] = _value[i];
          if (amountToAdd > 0){
            emit Transfer (supplyOwner, _to[i], amountToAdd);
          }
      }
  }

  /**
   * Initialize the token holders and hold amounts by contract owner
   *
   * @param _to addresses to allocate token for
   * @param _value number of tokens to be allocated
   * @param _holds number of tokens to hold from transferring
   */  
  function initAccounts (address [] _to, uint256 [] _value, uint256 [] _holds) public {
    setHolds(_to, _holds);
    initAccounts(_to, _value);
  }
  
  /**
   * Set the number of tokens to hold from transferring for a list of 
   * token holders.
   * 
   * @param _account list of account holders
   * @param _value list of token amounts to hold
   */
  function setHolds (address [] _account, uint256 [] _value) public {
    require (owners[msg.sender]);
    require (_account.length == _value.length);
    for (uint256 i=0; i < _account.length; i++){
        holds[_account[i]] = _value[i];
    }
  }
  
  /**
   * Get the number of account holders (for owner use)
   *
   * @return uint256
   */  
  function getNumAccounts () public constant returns (uint256 count) {
    require (owners[msg.sender]);
    return accountList.length;
  }
  
  /**
   * Get a list of account holder eth addresses (for owner use)
   *
   * @param _start index of the account holder list
   * @param _count of items to return
   * @return array of addresses
   */  
  function getAccounts (uint256 _start, uint256 _count) public constant returns (address [] addresses){
    require (owners[msg.sender]);
    require (_start >= 0 && _count >= 1);
    if (_start == 0 && _count >= accountList.length) {
      return accountList;
    }
    address [] memory _slice = new address[](_count);
    for (uint256 i=0; i < _count; i++){
      _slice[i] = accountList[i + _start];
    }
    return _slice;
  }
  
  /**
   * Freeze token transfers.
   * May only be called by smart contract owner.
   */
  function freezeTransfers () public {
    require (owners[msg.sender]);

    if (!frozen) {
      frozen = true;
      emit Freeze ();
    }
  }

  /**
   * Unfreeze token transfers.
   * May only be called by smart contract owner.
   */
  function unfreezeTransfers () public {
    require (owners[msg.sender]);

    if (frozen) {
      frozen = false;
      emit Unfreeze ();
    }
  }

  /**
   * Logged when token transfers were frozen.
   */
  event Freeze ();

  /**
   * Logged when token transfers were unfrozen.
   */
  event Unfreeze ();

  /**
   * Kill the token.
   */
  function kill() public { 
    if (owners[msg.sender]) selfdestruct(msg.sender);
  }
}
