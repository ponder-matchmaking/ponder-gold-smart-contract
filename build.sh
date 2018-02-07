grep -h pragma src/sol/*.sol | sort | uniq > build/PON.sol
cat src/sol/Token.sol src/sol/SafeMatch.sol src/sol/AbstractToken.sol src/sol/PonderGoldToken.sol | grep -v pragma >> build/PON.sol
echo "PON.sol created successfully."
