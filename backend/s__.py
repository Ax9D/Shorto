import os
import sys

str=sys.argv[1]
res=""
for i in range(0,100):
	res=res + str + " & "

os.system(res)
	
