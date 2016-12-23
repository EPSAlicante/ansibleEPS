#!/bin/bash

fileRules='/etc/init.d/.iptables.rules'
IPT='sudo /sbin/iptables'
GREP='/bin/grep'
DIFF='/usr/bin/diff'

STAT=0
OUTPUT=''

# Checking iptables exec permission
permIptables=`$IPT -nL >/dev/null 2>/dev/null`

if [ $? -ne 0 ]; then

    OUTPUT="ERROR No Iptables exec permission"
    STAT=2

else

    # Checking IPtables active rules amount
    numRules=`$IPT -nL|grep -v "^Chain"|grep -v "^target"|grep -v "^$"|wc -l`

    if [ $numRules -gt 0 ]; then

	# Checking rules files (created by '/etc/init.d/iptables.sh script)
        if [ -s "$fileRules" ]; then

	    # Checking read permission file
            if [ -r "$fileRules" ]; then

		# Checking if active rules are the same as rules in file
                $IPT -nL | $DIFF "$fileRules" - > /dev/null
                if [ $? -eq 0 ]; then
                    # They are the same 
                    OUTPUT="OK Iptables ($numRules reglas)<br>"
                    STAT=0
                else
                    # No son iguales, puede que se hayan añadido o borrado reglas manualmente
		    # They are different, rules could have been manually deleted or added
                    OUTPUT="ERROR Iptables different from script"
                    STAT=2
                fi
            else
                OUTPUT="ERROR No read permission file"
                STAT=2
            fi
        else
	    # There's no rules file, rules could have been manually created
            OUTPUT="ERROR script iptables.sh not started"
            STAT=2
        fi
    else

        # No rules 
        OUTPUT="ERROR No rules"
        STAT=2
    fi

fi

echo $OUTPUT

exit $STAT

