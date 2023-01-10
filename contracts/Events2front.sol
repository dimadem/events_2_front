// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.1;

contract Events2front {

    mapping (address => uint) contributionDate;
    uint public largestContribution;
    address public largestContributor;

    event Contribute(address indexed contributorSearch, address contributor, uint contribution);
    event NewLargestContributor(address contributor, uint contribution);
    event WithdrawMoney(address contributor, uint balance);

    modifier mainContributor {
	        require(msg.sender == largestContributor, 
            "caller is not the largest Contributor" );

	        require(contributionDate[msg.sender] < block.timestamp, 
            "please wait" );
	        _;
	    }

    function contribute(uint256 amount) public payable {

        contributionDate[msg.sender] = block.timestamp + 1 minutes;
        emit Contribute(msg.sender, msg.sender, amount);

        if(largestContribution < msg.value)
        {
            largestContributor = msg.sender;
            emit NewLargestContributor(msg.sender, msg.value);
        }
    }

    function getBalance() public view returns(uint) {
        return address(this).balance;
    }

     function withdrawMoneyTo(address payable _to) mainContributor public {
         uint balance=getBalance();
        _to.transfer(balance);
        emit NewLargestContributor(msg.sender, balance);
    }
}
