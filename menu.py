#!/usr/bin/python
# The source code packaged with this file is Free Software, Copyright (C) 2016 by
# Unidad de Laboratorios, Escuela Politecnica Superior, Universidad de Alicante :: <aeps at eps.ua.es>.
# It's licensed under the AFFERO GENERAL PUBLIC LICENSE unless stated otherwise.
# You can get copies of the licenses here: http://www.affero.org/oagpl.html
# AFFERO GENERAL PUBLIC LICENSE is also included in the file called "LICENSE".


import subprocess
import sys
import os
import readline


# Configuration Files
pathAnsible = "/etc/ansibleEPS"
pathConfig = "%s/group_vars/all" % (pathAnsible)
pathDirectoryLogs = "/var/log/ansibleEPS"
pathFileErrors = "%s/errors.log" % (pathDirectoryLogs)
pathFileChanges = "%s/changes.log" % (pathDirectoryLogs)
pathFileExeList = "%s/summary.log" % (pathDirectoryLogs)
pathInventory = "%s/eps" % (pathAnsible)


def raw_input_def(prompt, default):
    def pre_input_hook():
        readline.insert_text(default)
        readline.redisplay()

    readline.set_pre_input_hook(pre_input_hook)
    try:
      return raw_input(prompt)
    finally:
      readline.set_pre_input_hook(None)


def question(cad, default, countErrors):
    correct = False
    count = 0
    if default.lower().strip() == "y" or default.lower().strip() == "n":
      defValue = default.lower().strip()
    else:
      defValue = "y"
    if countErrors > 0:
      maxErrors = countErrors
    else:
      maxErrors = 3

    while not correct:
      inputValue = raw_input_def("%s (y/n) " % (cad), "%s" % (defValue))
      if inputValue.lower().strip() == 'y' or inputValue.lower().strip() == 'n':
        correct = True
        answer = inputValue.lower().strip()
        print
        continue
      else:
        print "ERROR: value %s is not valid. Values (y/n)" % (inputValue.strip())

      count += 1
      if count > maxErrors:
        print "Too many Errors. Exiting..."
        return "n" 

    return answer


def getValueFromFile(file, label, separator):
    value = ""
    if os.access(file, os.R_OK):
      f = open(file, "r")
      for line in f:
        if line.startswith(label):
          value = line.split(separator,1)[1].strip() 

    return value


def getInventory(cadena):
    retCad = ""
    # Trying to find node in inventory 
    retNode = subprocess.Popen("(cat %s|grep -i '^%s$'|head -1) 2>/dev/null" % (pathInventory,cadena), shell=True, stdout=subprocess.PIPE).stdout.read()
    if retNode != "":
      retCad = retNode
    else:
      # Trying to find group in inventory 
      retGroup = subprocess.Popen("(cat %s|grep -i '^\[%s\:children\]$'|cut -d':' -f1|cut -d '[' -f2|head -1) 2>/dev/null" % (pathInventory,cadena), shell=True, stdout=subprocess.PIPE).stdout.read()
      if retGroup != "":
	retCad = retGroup
      else:
	# Trying to find extra group in inventory
	retExtra = subprocess.Popen("(cat %s|grep -i '^\[%s\]$'|cut -d']' -f1|cut -d '[' -f2|head -1) 2>/dev/null" % (pathInventory,cadena), shell=True, stdout=subprocess.PIPE).stdout.read()
	if retExtra != "":
	  retCad = retExtra

    return retCad 


def printMenu():

    print "############### ADMIN MENU EPS ##################"
    print "##                                             ##"
    print "##  0. Help                                    ##"
    print "##---------------------------------------------##" 
    print "##  1. Common module (nodes config)            ##"
    print "##  2. Hosts File module (nodes config)        ##"
    print "##  3. Sudoers module (nodes config)           ##"
    print "##  4. TCP Wrappers module (nodes config)      ##"
    print "##  5. PAM Access module (nodes config)        ##"
    print "##  6. NRPE module (nodes config)              ##"
    print "##  7. IPTables module (nodes config)          ##"
    print "##  8. Crontab module (nodes config)           ##"
    print "##  9. Proxmox module (Proxmox nodes config)   ##"
    print "## 10. All modules (nodes config)              ##"
    print "##---------------------------------------------##"
    print "##  b. Bacula Servers (bacula config)          ##"
    print "##  d. DHCP Servers (DHCP config)              ##"
    print "##  m. Munin Servers (munin config)            ##"
    print "##  n. Nagios Servers (nagios config)          ##"
    print "##  i. Email addresses List (getting data)     ##"
    print "##---------------------------------------------##"
    print "##  a. Add Node(s)                             ##"
    print "##  s. Stop/Start/Restart System               ##"
    print "##  l. Check System Logs (Errors and Changes)  ##"
    print "##  c. Clean System Logs                       ##"
    print "##  x. View executions list                    ##"
    print "##  r. Log Running Executions (Crt+C to Exit)  ##"
    print "##  u. Update (servers update)                 ##"
    print "##  v. Inventory List                          ##"
    print "##  q. Quit Menu                               ##"
    print "##                                             ##"
    print "#################################################"


def selectOption():

    answer = None
    legal_answers = ['0','1','2','3','4','5','6','7', '8', '9', '10', 'a', 'b', 'c', 'd', 'i', 'l', 'm', 'n', 'r', 's', 'u', 'v', 'x', 'q']
    tried = False
    while answer not in legal_answers:
        print "%s" % "Invalid input, select again" if tried else ""
        answer = raw_input('Select option: ')
        tried = True

    return answer


def execOption(opt):

    if opt == '0':
      ## Help Menu ##
      retCode = subprocess.call("%s/help.py" % (pathAnsible), shell=True)


    elif opt == '1':
      ## Common configuration (for nodes) ##
      # Modules: locales, manager, group, repos, dselect, concurrency, services, resolv, nscd, securetty, profile, nvi, utils, munin-node, nrpe, pam-ldap, syslog, sshd, ntp, bacula-fd, ossec 
      try: 
        print
        module = raw_input('Module (locales, manager, group, repos, dselect, concurrency, services, resolv, nscd, securetty, profile, nvi, utils, munin-node, nrpe, pam-ldap, syslog, sshd, ntp, bacula-fd, ossec) or ALL (enter): ')

        if module in ['locales','manager','group','repos','dselect','concurrency','services','resolv','nscd','securetty','profile','nvi','utils','munin-node','nrpe','pam-ldap','syslog','sshd','ntp','bacula-fd','ossec']:

          nodeName = raw_input('Node (hostname) or Group (name) or All (enter): ')

          if nodeName:
            nodeInventory = getInventory(nodeName) 
            if nodeInventory != "":
              print
              print "cd %s && ansible-playbook %s/common.yml -t %s --limit %s" % (pathAnsible,pathAnsible,module,nodeInventory)
              retCode = subprocess.call("cd %s && ansible-playbook %s/common.yml -t %s --limit %s" % (pathAnsible,pathAnsible,module,nodeInventory), shell=True)

            else:
              print >> sys.stderr
              print >> sys.stderr, "%s is not in inventory" % (nodeName)
              print >> sys.stderr

          else:
            print
            print "cd %s && ansible-playbook %s/common.yml -t %s" % (pathAnsible,pathAnsible,module)
	    retCode = subprocess.call("cd %s && ansible-playbook %s/common.yml -t %s" % (pathAnsible,pathAnsible,module), shell=True)

        elif not module:
	  nodeName = raw_input('Node (hostname) or Group (name) or All (enter): ')

          if nodeName:
            nodeInventory = getInventory(nodeName) 
            if nodeInventory != "":
              print
              print "cd %s && ansible-playbook %s/common.yml --limit %s" % (pathAnsible,pathAnsible,nodeInventory)
              retCode = subprocess.call("cd %s && ansible-playbook %s/common.yml --limit %s" % (pathAnsible,pathAnsible,nodeInventory), shell=True)

            else:
              print >> sys.stderr
              print >> sys.stderr, "%s is not in inventory" % (nodeName)
              print >> sys.stderr

          else:
            print
            print "cd %s && ansible-playbook %s/common.yml" % (pathAnsible,pathAnsible)
            retCode = subprocess.call("cd %s && ansible-playbook %s/common.yml" % (pathAnsible,pathAnsible), shell=True)

        else:
          print >> sys.stderr
          print >> sys.stderr, "Option %s not valid (Valid options: locales, manager, group, repos, dselect, concurrency, services, resolv, nscd, securetty, profile, nvi, utils, munin-node, nrpe, pam-ldap, syslog, sshd, ntp, bacula-fd, ossec)" % (module)
          print >> sys.stderr

      except KeyboardInterrupt:
        nodeName = ""
        print
        print "Interrupted"
        print

    elif opt == '2':
      ## /etc/hosts File configuration (for nodes) ##
      # Ask hostname
      try:
        nodeName = raw_input('Node (hostname) or Group (name) or All (enter): ')

        if nodeName:
          nodeInventory = getInventory(nodeName) 
          if nodeInventory != "":
            print
            print "cd %s && ansible-playbook %s/hostsFile.yml --limit %s" % (pathAnsible,pathAnsible,nodeInventory)
            retCode = subprocess.call("cd %s && ansible-playbook %s/hostsFile.yml --limit %s" % (pathAnsible,pathAnsible,nodeInventory), shell=True)
          else:
            print >> sys.stderr
            print >> sys.stderr, "%s is not in inventory" % (nodeName)
            print >> sys.stderr

        else:
          print
          print "cd %s && ansible-playbook %s/hostsFile.yml" % (pathAnsible,pathAnsible)
          retCode = subprocess.call("cd %s && ansible-playbook %s/hostsFile.yml" % (pathAnsible,pathAnsible), shell=True)

      except KeyboardInterrupt:
        nodeName = ""
        print
        print "Interrupted"
        print

    elif opt == '3':
      ## /etc/sudoers File configuration (for nodes) ##
      # Ask hostname
      try:
        nodeName = raw_input('Node (hostname) or Group (name) or All (enter): ')

        if nodeName:
          nodeInventory = getInventory(nodeName) 
          if nodeInventory != "":
            print
            print "cd %s && ansible-playbook %s/sudo.yml --limit %s" % (pathAnsible,pathAnsible,nodeInventory)
            retCode = subprocess.call("cd %s && ansible-playbook %s/sudo.yml --limit %s" % (pathAnsible,pathAnsible,nodeInventory), shell=True)
          else:
            print >> sys.stderr
            print >> sys.stderr, "%s is not in inventory" % (nodeName)
            print >> sys.stderr

        else:
          print
          print "cd %s && ansible-playbook %s/sudo.yml" % (pathAnsible,pathAnsible)
          retCode = subprocess.call("cd %s && ansible-playbook %s/sudo.yml" % (pathAnsible,pathAnsible), shell=True)

      except KeyboardInterrupt:
        nodeName = ""
        print
        print "Interrupted"
        print

    elif opt == '4':
      ## TCP Wrappers Files configuration (for nodes) ##
      # Ask hostname
      try:
        nodeName = raw_input('Node (hostname) or Group (name) or All (enter): ')

        if nodeName:
          nodeInventory = getInventory(nodeName) 
          if nodeInventory != "":
            print
            print "cd %s && ansible-playbook %s/wrappers.yml --limit %s" % (pathAnsible,pathAnsible,nodeInventory)
            retCode = subprocess.call("cd %s && ansible-playbook %s/wrappers.yml --limit %s" % (pathAnsible,pathAnsible,nodeInventory), shell=True)
          else:
            print >> sys.stderr
            print >> sys.stderr, "%s is not in inventory" % (nodeName)
            print >> sys.stderr

        else:
          print
          print "cd %s && ansible-playbook %s/wrappers.yml" % (pathAnsible,pathAnsible)
          retCode = subprocess.call("cd %s && ansible-playbook %s/wrappers.yml" % (pathAnsible,pathAnsible), shell=True)

      except KeyboardInterrupt:
        nodeName = ""
        print
        print "Interrupted"
        print

    elif opt == '5':
      ## /etc/security/access.conf File configuration (for nodes) ##
      # Ask hostname
      try:
        nodeName = raw_input('Node (hostname) or Group (name) or All (enter): ')

        if nodeName:
          nodeInventory = getInventory(nodeName) 
          if nodeInventory != "":
            print
            print "cd %s && ansible-playbook %s/pamAccess.yml --limit %s" % (pathAnsible,pathAnsible,nodeInventory)
            retCode = subprocess.call("cd %s && ansible-playbook %s/pamAccess.yml --limit %s" % (pathAnsible,pathAnsible,nodeInventory), shell=True)
          else:
            print >> sys.stderr
            print >> sys.stderr, "%s is not in inventory" % (nodeName)
            print >> sys.stderr

        else:
          print
          print "cd %s && ansible-playbook %s/pamAccess.yml" % (pathAnsible,pathAnsible)
          retCode = subprocess.call("cd %s && ansible-playbook %s/pamAccess.yml" % (pathAnsible,pathAnsible), shell=True)

      except KeyboardInterrupt:
        nodeName = ""
        print
        print "Interrupted"
        print

    elif opt == '6':
      ## Nagios-NRPE File configuration (for nodes) ##
      # Ask hostname
      try:
        nodeName = raw_input('Node (hostname) or Group (name) or All (enter): ')

        if nodeName:
          nodeInventory = getInventory(nodeName)
          if nodeInventory != "":
            print
            print "cd %s && ansible-playbook %s/nrpe.yml --limit %s" % (pathAnsible,pathAnsible,nodeInventory)
            retCode = subprocess.call("cd %s && ansible-playbook %s/nrpe.yml --limit %s" % (pathAnsible,pathAnsible,nodeInventory), shell=True)
          else:
            print >> sys.stderr
            print >> sys.stderr, "%s is not in inventory" % (nodeName)
            print >> sys.stderr

        else:
          print
          print "cd %s && ansible-playbook %s/nrpe.yml" % (pathAnsible,pathAnsible)
          retCode = subprocess.call("cd %s && ansible-playbook %s/nrpe.yml" % (pathAnsible,pathAnsible), shell=True)

      except KeyboardInterrupt:
        nodeName = ""
        print
        print "Interrupted"
        print

    elif opt == '7':
      ## IPTables configuration (for nodes) ##
      # Ask hostname
      try:
        nodeName = raw_input('Node (hostname) or Group (name) or All (enter): ')

        if nodeName:
          nodeInventory = getInventory(nodeName) 
          if nodeInventory != "":
            print
            print "cd %s && ansible-playbook %s/iptables.yml --limit %s" % (pathAnsible,pathAnsible,nodeInventory)
            retCode = subprocess.call("cd %s && ansible-playbook %s/iptables.yml --limit %s" % (pathAnsible,pathAnsible,nodeInventory), shell=True)
          else:
            print >> sys.stderr
            print >> sys.stderr, "%s is not in inventory" % (nodeName)
            print >> sys.stderr

        else:
          print
          print "cd %s && ansible-playbook %s/iptables.yml" % (pathAnsible,pathAnsible)
          retCode = subprocess.call("cd %s && ansible-playbook %s/iptables.yml" % (pathAnsible,pathAnsible), shell=True)

      except KeyboardInterrupt:
        nodeName = ""
        print
        print "Interrupted"
        print

    elif opt == '8':
      ## Crontab configuration (for nodes) ##
      # Ask hostname
      try:
        nodeName = raw_input('Node (hostname) or Group (name) or All (enter): ')

        if nodeName:
          nodeInventory = getInventory(nodeName)
          if nodeInventory != "":
            print
            print "cd %s && ansible-playbook %s/crontab.yml --limit %s" % (pathAnsible,pathAnsible,nodeInventory)
            retCode = subprocess.call("cd %s && ansible-playbook %s/crontab.yml --limit %s" % (pathAnsible,pathAnsible,nodeInventory), shell=True)
          else:
            print >> sys.stderr
            print >> sys.stderr, "%s is not in inventory" % (nodeName)
            print >> sys.stderr

        else:
          print
          print "cd %s && ansible-playbook %s/crontab.yml" % (pathAnsible,pathAnsible)
          retCode = subprocess.call("cd %s && ansible-playbook %s/crontab.yml" % (pathAnsible,pathAnsible), shell=True)

      except KeyboardInterrupt:
        nodeName = ""
        print
        print "Interrupted"
        print

    elif opt == '9':
      ## Proxmox configuration (for nodes) ##
      # Ask hostname
      try:
        nodeName = raw_input('Node (hostname) or Group (name) or All (enter): ')

        if nodeName:
          nodeInventory = getInventory(nodeName) 
          if nodeInventory != "":
            print
            print "cd %s && ansible-playbook %s/proxmox.yml --limit %s" % (pathAnsible,pathAnsible,nodeInventory)
            retCode = subprocess.call("cd %s && ansible-playbook %s/proxmox.yml --limit %s" % (pathAnsible,pathAnsible,nodeInventory), shell=True)
          else:
            print >> sys.stderr
            print >> sys.stderr, "%s is not in inventory" % (nodeName)
            print >> sys.stderr

        else:
          print
          print "cd %s && ansible-playbook %s/proxmox.yml" % (pathAnsible,pathAnsible)
          retCode = subprocess.call("cd %s && ansible-playbook %s/proxmox.yml" % (pathAnsible,pathAnsible), shell=True)

      except KeyboardInterrupt:
        nodeName = ""
        print
        print "Interrupted"
        print

    elif opt == '10':
      ## Site configuration -> 'total configuration' (for nodes) ##
      # Ask hostname
      try:
        nodeName = raw_input('Node (hostname) or Group (name) or All (enter): ')

        if nodeName:
          nodeInventory = getInventory(nodeName) 
          if nodeInventory != "":
            print
            print "cd %s && ansible-playbook %s/site.yml --limit %s" % (pathAnsible,pathAnsible,nodeInventory)
            retCode = subprocess.call("cd %s && ansible-playbook %s/site.yml --limit %s" % (pathAnsible,pathAnsible,nodeInventory), shell=True)
          else:
            print >> sys.stderr
            print >> sys.stderr, "%s is not in inventory" % (nodeName)
            print >> sys.stderr

        else:
          print
          print "cd %s && ansible-playbook %s/site.yml" % (pathAnsible,pathAnsible)
          retCode = subprocess.call("cd %s && ansible-playbook %s/site.yml" % (pathAnsible,pathAnsible), shell=True)

      except KeyboardInterrupt:
        nodeName = ""
        print
        print "Interrupted"
        print

    elif opt == 'a':
      ## Configure hosts as nodes ##
      # Ask ssh User
      try:
        print
	print "Remember that node has to be introduced manually in inventory file"
	print
        sshUserNodes = raw_input('What user will you use? ')
        if sshUserNodes:
          # Ask host name or IP
          print
          host = raw_input('Hostname or IP: ')

          if host:
            print
            retCode = subprocess.call("%s/scripts/setupNode.py %s %s 9999" % (pathAnsible,host,sshUserNodes), shell=True)
          else:
            print >> sys.stderr, "You have to introduce a name or IP"
            print >> sys.stderr

        else:
          print >> sys.stderr, "You have to introduce a ssh User"
          print >> sys.stderr

      except KeyboardInterrupt:
        host = ""
        print
        print "Interrupted"
        print


    elif opt == 'b':
      ## Bacula configuration (for Bacula servers) ##
      print
      print "cd %s && ansible-playbook %s/baculaAdmon.yml" % (pathAnsible,pathAnsible)
      retCode = subprocess.call("cd %s && ansible-playbook %s/baculaAdmon.yml" % (pathAnsible,pathAnsible), shell=True)

    elif opt == 'd':
      ## DHCP configuration (for DHCP servers) ##
      try:
        building = raw_input('Building (P1, P4, Elec or TV) or ALL (enter): ')

        if building in ['P1','P4','Elec','TV']:
          print
          print "cd %s && ansible-playbook %s/dhcp.yml -t %s" % (pathAnsible,pathAnsible,building)
          retCode = subprocess.call("cd %s && ansible-playbook %s/dhcp.yml -t %s" % (pathAnsible,pathAnsible,building), shell=True)

        elif not building:
          print
          print "cd %s && ansible-playbook %s/dhcp.yml" % (pathAnsible,pathAnsible)
          retCode = subprocess.call("cd %s && ansible-playbook %s/dhcp.yml" % (pathAnsible,pathAnsible), shell=True)
        else:
          print >> sys.stderr
          print >> sys.stderr, "Option %s not valid (Valid options: P1, P2, P4, Elec or TV)" % (building)
          print >> sys.stderr

      except KeyboardInterrupt:
        nodeName = ""
        print
        print "Interrupted"
        print

    elif opt == 'm':
      ## Munin configuration (for Munin servers) ##
      print
      print "cd %s && ansible-playbook %s/munin.yml" % (pathAnsible,pathAnsible)
      retCode = subprocess.call("cd %s && ansible-playbook %s/munin.yml" % (pathAnsible,pathAnsible), shell=True)

    elif opt == 'n':
      ## Nagios configuration (for Nagios servers) ##
      print
      print "cd %s && ansible-playbook %s/nagios.yml" % (pathAnsible,pathAnsible)
      retCode = subprocess.call("cd %s && ansible-playbook %s/nagios.yml" % (pathAnsible,pathAnsible), shell=True)


    elif opt == 'i':
      ## Listado de correos (for Qmail server) ##
      print
      print "cd %s && ansible-playbook %s/listaCorreos.yml" % (pathAnsible,pathAnsible)
      retCode = subprocess.call("cd %s && ansible-playbook %s/listaCorreos.yml" % (pathAnsible,pathAnsible), shell=True)


    elif opt == 's':
      ## Stop/Start/Restart System ##
      try:
	operation = raw_input('Operation (stop, start or restart): ')

	if operation == "stop":
	  # Stop System
          print
          print "cd %s && ansible-playbook %s/cron.yml -t cronStop" % (pathAnsible,pathAnsible)
          print
          retCode = subprocess.call("cd %s && ansible-playbook %s/cron.yml -t cronStop" % (pathAnsible,pathAnsible), shell=True)
	elif operation == "start":
	  # Start System
	  print
	  print "cd %s && ansible-playbook %s/cron.yml -t cronStart" % (pathAnsible,pathAnsible)
	  print
	  retCode = subprocess.call("cd %s && ansible-playbook %s/cron.yml -t cronStart" % (pathAnsible,pathAnsible), shell=True)
        elif operation == "restart":
          # Start System
          print
          print "cd %s && ansible-playbook %s/cron.yml -t cronStop && ansible-playbook %s/cron.yml -t cronStart" % (pathAnsible,pathAnsible, pathAnsible)
          print
          retCode = subprocess.call("cd %s && ansible-playbook %s/cron.yml -t cronStop && ansible-playbook %s/cron.yml -t cronStart" % (pathAnsible,pathAnsible,pathAnsible), shell=True)
	
	else:
          print >> sys.stderr
          print >> sys.stderr, "Option %s not valid (Valid options: stop, start, or restart)" % (operation)
          print >> sys.stderr

      except KeyboardInterrupt:
        nodeName = ""
        print
        print "Interrupted"
        print

    elif opt == 't':
      ## Start System ##
      print
      print "cd %s && ansible-playbook %s/cron.yml -t cronStart" % (pathAnsible,pathAnsible)
      print
      retCode = subprocess.call("cd %s && ansible-playbook %s/cron.yml -t cronStart" % (pathAnsible,pathAnsible), shell=True)

    elif opt == 'l':
      ## Check log files (errors and changes) ##
      # Check directory
      if os.path.isdir(pathDirectoryLogs):
        try:
          logFile = raw_input('View Errors or Changes (e/c): ')

          if logFile == 'e':
            # Check errors file
            if os.access(pathFileErrors, os.R_OK):
              # Type of list: summary or details
              print
              typeList = raw_input('There are errors. View summary or details (s/d): ')
              if typeList == 's':
                retCode = subprocess.call("grep -h -e '### ' -e '^fatal: ' -e '^failed: ' %s|sed '/### /{x;p;x;G;}'|sed '/^fatal:/G'|sed '/^failed:/G'|less" % (pathFileErrors), shell=True)
                print
              elif typeList == 'd':
                retCode = subprocess.call("less %s" % (pathFileErrors), shell=True)
                print
              else:
                print >> sys.stderr, "Error: available options 's' (summary) or 'd' (details)"
                print >> sys.stderr
            else:
              print
              print "No errors"
              print
	  elif logFile == 'c':
            # Check changes file
            if os.access(pathFileChanges, os.R_OK):
              retCode = subprocess.call("less %s" % (pathFileChanges), shell=True)
              print
            else:
              print
              print "No changes"
              print

      	except KeyboardInterrupt:
          print
          print "Interrupted"
          print

      else:
        print >> sys.stderr, "Directory %s doesn't exist" % (pathDirectoryLogs)
        print >> sys.stderr

    elif opt == 'c':
      ## Clean logs files (errors and changes) ##
      # Check directory
      if os.path.isdir(pathDirectoryLogs):
        # Check errors file
        if os.access(pathFileErrors, os.R_OK):
          # Delete errors file
          retCode = subprocess.call("rm -f %s" % (pathFileErrors), shell=True)
          if retCode == 0:
            print
            print "System Errors file deleted."
            print
          else:
            print >> sys.stderr, "Error deleting errors file (System)"
            print >> sys.stderr
        else:
          print
          print "No errors (System)"
          print

        # Check changes file
        if os.access(pathFileChanges, os.R_OK):
          # Delete changes file
          retCode = subprocess.call("rm -f %s" % (pathFileChanges), shell=True)
          if retCode == 0:
            print "System Changes file deleted."
            print
          else:
            print >> sys.stderr, "Error deleting changes file (System)"
            print >> sys.stderr
        else:
          print "No changes (System)"
          print

      else:
        print >> sys.stderr, "Directory %s doesn't exist" % (pathDirectoryLogs)
        print >> sys.stderr

    elif opt == 'x':
      ## View executions List ##
      # Check directory
      if os.path.isdir(pathDirectoryLogs):
        if os.access(pathFileExeList, os.R_OK):
          retCode = subprocess.call("less %s" % (pathFileExeList), shell=True)
          print
        else:
          print >> sys.stderr, "File %s don't exist or not readable" % (pathFileExeList)
          print >> sys.stderr

      else:
        print >> sys.stderr, "Directory %s doesn't exist" % (pathDirectoryLogs)
        print >> sys.stderr

    elif opt == 'r':
      ## View Log Running Executions 
      # Check directory
      if os.path.isdir(pathDirectoryLogs):
        totalLogs = int(subprocess.Popen("(ls -la %s/.*.tmp|awk '{print $6,$7,$8,$5,substr($9,length(\"%s\")+2)}'|wc -l) 2> /dev/null" % (pathDirectoryLogs,pathDirectoryLogs), shell=True, stdout=subprocess.PIPE).stdout.read())
        if totalLogs > 0:
          # List logs files
          print
          print "List of running executions"
          print
          logs = [""]
          countLogs = 0 
          for lineLogs in subprocess.Popen("ls -la %s/.*.tmp|awk '{print $6,$7,$8,$5,substr($9,length(\"%s\")+2)}' 2> /dev/null" % (pathDirectoryLogs,pathDirectoryLogs), shell=True, stdout=subprocess.PIPE).stdout.readlines():
            logs.append(lineLogs.split(' ')[4].strip())
            countLogs += 1
            print "(%s) %s" %(countLogs,lineLogs)
	    print

          # Ask execution (number)
          try:
            print
            inputValue = raw_input('Number Execution: ')

            if inputValue:
              try:
                numberLog = int(inputValue)
		
              except:
		print >> sys.stderr
                print >> sys.stderr, "Option %s not valid, only numbers of Logs List " % (inputValue)
                print >> sys.stderr

              if numberLog > 0 and numberLog <= totalLogs:
		try: 
	 	  retCode = subprocess.call("echo; echo '%s LOGS'; echo; grep '^TASK ' %s/%s; echo; tail -f %s/%s" % (logs[numberLog],pathDirectoryLogs,logs[numberLog],pathDirectoryLogs,logs[numberLog]), shell=True)
		except KeyboardInterrupt:
		  print

	      else:
		print >> sys.stderr
                print >> sys.stderr, "Option %s not valid, only numbers of Logs List " % (inputValue) 
                print >> sys.stderr

            else:
	      print >> sys.stderr
              print >> sys.stderr, "Introduce a number of Logs List"
              print >> sys.stderr

          except KeyboardInterrupt:
            print
            print "Interrupted"
            print

	else:
	  print
	  print "No log files"
	  print

      else:
        print >> sys.stderr, "Directory %s doesn't exist" % (pathDirectoryLogs)
        print >> sys.stderr

    elif opt == 'u':
      ## Update (for nodes) ##
      try:
        nodeName = raw_input('Node (hostname) or Group (name) or All (enter): ')

        if nodeName:
          nodeInventory = getInventory(nodeName) 
          if nodeInventory != "":
            print
            print "cd %s && ansible-playbook %s/update.yml --limit %s" % (pathAnsible,pathAnsible,nodeInventory)
            retCode = subprocess.call("cd %s && ansible-playbook %s/update.yml --limit %s" % (pathAnsible,pathAnsible,nodeInventory), shell=True)
          else:
            print >> sys.stderr
            print >> sys.stderr, "%s is not in inventory" % (nodeName)
            print >> sys.stderr

        else:
          OSType = raw_input('OS (Centos or Debian) or ALL (enter): ')

          if OSType in ['Centos','Debian']:
            print
            print "cd %s && ansible-playbook %s/update.yml -t %s" % (pathAnsible,pathAnsible,OSType)
            retCode = subprocess.call("cd %s && ansible-playbook %s/update.yml -t %s" % (pathAnsible,pathAnsible,OSType), shell=True)

          elif not OSType:
            print
            print "cd %s && ansible-playbook %s/update.yml" % (pathAnsible,pathAnsible)
            retCode = subprocess.call("cd %s && ansible-playbook %s/update.yml" % (pathAnsible,pathAnsible), shell=True)
          else:
            print >> sys.stderr
            print >> sys.stderr, "Option %s not valid (Valid options: Centos or Debian)" % (OSType)
            print >> sys.stderr

      except KeyboardInterrupt:
        nodeName = ""
        print
        print "Interrupted"
        print

    elif opt == 'v':
      ## View Inventory ##
      if os.access(pathInventory, os.R_OK):
        retCode = subprocess.call("less %s" % (pathInventory), shell=True)
        print
      else:
        print >> sys.stderr, "File %s don't exist or not readable" % (pathInventory)
        print >> sys.stderr


    else:
      print "Option %s not valid" % (opt)

    raw_input("Press Enter to show Menu EPS ") 



def main():

    option = '-1'

    while option != 'q':
      try:
        os.system("clear")
        print
        printMenu()
        option = selectOption() 
        if option != 'q':
          execOption(option)

      except KeyboardInterrupt:
	option = 'q'
	print
	print "Interrupted"
	print

    print 
    print "Bye"
    print
    sys.exit(0)



if __name__ == '__main__':
	    main()

