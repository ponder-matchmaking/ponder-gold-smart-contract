/**
 * Abstract Token Smart Contract that could be used as a base contract for
 * ERC-20 token contracts.
 */

contract AbstractToken is Token, SafeMath {
  /**
   * Create new Abstract Token contract.
   */
  function AbstractToken () public {
    // Do nothing
  }

  /**
   * Get number of tokens currently belonging to given owner.
   *
   * @param _owner address to get number of tokens currently belonging to the
   *        owner of
   * @return number of tokens currently belonging to the owner of given address
   */
  function balanceOf (address _owner) public constant returns (uint256 balance) {
    return accounts [_owner];
  }

  /**
   * Get number of tokens currently belonging to given owner and available for transfer.
   *
   * @param _owner address to get number of tokens currently belonging to the
   *        owner of
   * @return number of tokens currently belonging to the owner of given address
   */
  function transferrableBalanceOf (address _owner) public constant returns (uint256 balance) {
    if (holds[_owner] > accounts[_owner]) {
        return 0;
    } else {
        return safeSub(accounts[_owner], holds[_owner]);
    }
  }

  /**
   * Transfer given number of tokens from message sender to given recipient.
   *
   * @param _to address to transfer tokens to the owner of
   * @param _value number of tokens to transfer to the owner of given address
   * @return true if tokens were transferred successfully, false otherwise
   */
  function transfer (address _to, uint256 _value) public returns (bool success) {
    require (transferrableBalanceOf(msg.sender) >= _value);
    if (_value > 0 && msg.sender != _to) {
      accounts [msg.sender] = safeSub (accounts [msg.sender], _value);
      if (!hasAccount[_to]) {
          hasAccount[_to] = true;
          accountList.push(_to);
      }
      accounts [_to] = safeAdd (accounts [_to], _value);
    }
    emit Transfer (msg.sender, _to, _value);
    return true;
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
    require (allowances [_from][msg.sender] >= _value);
    require (transferrableBalanceOf(_from) >= _value);

    allowances [_from][msg.sender] =
      safeSub (allowances [_from][msg.sender], _value);

    if (_value > 0 && _from != _to) {
      accounts [_from] = safeSub (accounts [_from], _value);
      if (!hasAccount[_to]) {
          hasAccount[_to] = true;
          accountList.push(_to);
      }
      accounts [_to] = safeAdd (accounts [_to], _value);
    }
    emit Transfer (_from, _to, _value);
    return true;
  }

  /**
   * Allow given spender to transfer given number of tokens from message sender.
   *
   * @param _spender address to allow the owner of to transfer tokens from
   *        message sender
   * @param _value number of tokens to allow to transfer
   * @return true if token transfer was successfully approved, false otherwise
   */
  function approve (address _spender, uint256 _value) public returns (bool success) {
    allowances [msg.sender][_spender] = _value;
    emit Approval (msg.sender, _spender, _value);

    return true;
  }

  /**
   * Tell how many tokens given spender is currently allowed to transfer from
   * given owner.
   *
   * @param _owner address to get number of tokens allowed to be transferred
   *        from the owner of
   * @param _spender address to get number of tokens allowed to be transferred
   *        by the owner of
   * @return number of tokens given spender is currently allowed to transfer
   *         from given owner
   */
  function allowance (address _owner, address _spender) public constant
  returns (uint256 remaining) {
    return allowances [_owner][_spender];
  }

  /**
   * Mapping from addresses of token holders to the numbers of tokens belonging
   * to these token holders.
   */
  mapping (address => uint256) accounts;

  /**
   * Mapping from address of token holders to a boolean to indicate if they have
   * already been added to the system.
   */
  mapping (address => bool) internal hasAccount;
  
  /**
   * List of available accounts.
   */
  address [] internal accountList;
  
  /**
   * Mapping from addresses of token holders to the mapping of addresses of
   * spenders to the allowances set by these token holders to these spenders.
   */
  mapping (address => mapping (address => uint256)) private allowances;

  /**
   * Mapping from addresses of token holds which cannot be spent until released.
   */
  mapping (address =>  uint256) internal holds;
}
