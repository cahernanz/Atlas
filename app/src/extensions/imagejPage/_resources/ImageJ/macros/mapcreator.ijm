arguments = getArgument();
argument = split(arguments,'#');

print(arguments);
print(getArgument());

open(argument[0]);
run("Map creator", argument[1]);