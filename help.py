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
pathHelpMenu = "%s/help/MENU" % (pathAnsible)
pathHelpIntro = "%s/help/INTRO" % (pathAnsible)
pathHelpDescription = "%s/help/DESCRIPTION" % (pathAnsible)
pathHelpStructure = "%s/help/STRUCTURE" % (pathAnsible)
pathHelpFAQ = "%s/help/FAQ" % (pathAnsible)
pathHelpExample = "%s/help/EXAMPLE" % (pathAnsible)


def printMenu():

    print "################## HELP MENU ####################"
    print "##                                             ##"
    print "##  1. Admin Menu                              ##"
    print "##  2. Modules                                 ##"
    print "##  3. Ansible Introduction                    ##"
    print "##  4. System Description                      ##"
    print "##  5. Structure                               ##"
    print "##  6. FAQ                                     ##"
    print "##  q. Quit Menu                               ##"
    print "##                                             ##"
    print "##  Type 'q' to end watching doc files         ##"
    print "##                                             ##"
    print "#################################################"


def selectOption():

    answer = None
    legal_answers = ['1','2','3','4','5','6','q']
    tried = False
    while answer not in legal_answers:
        print "%s" % "Invalid input, select again" if tried else ""
        answer = raw_input('Select option: ')
        tried = True

    return answer


def execOption(opt):

    if opt == '1':
      ## Read Menu Help ##
      if os.access(pathHelpMenu, os.R_OK):
	retCode = subprocess.call("less %s" % (pathHelpMenu), shell=True)
	print
      else:
	print >> sys.stderr, "File %s don't exist or not readable" % (pathHelpMenu)
	print >> sys.stderr

    elif opt == '2':
      ## Read Modules Help ##
      # Modules: common, hostsFile, sudo, wrappers, pamAccess, nrpe, iptables, proxmox, mycnf, apacheInc, bacula, dhcp, munin, nagios, emailList, update, cron
      try:
	print
	module = raw_input('Module (common, hostsFile, sudo, wrappers, pamAccess, nrpe, iptables, proxmox, mycnf, apacheInc, bacula, dhcp, munin, nagios, emailList, update, cron): ')
	if module.lower() in ['common', 'hostsfile', 'sudo', 'wrappers', 'pamaccess', 'nrpe', 'iptables', 'proxmox', 'mycnf', 'apacheinc', 'bacula', 'dhcp', 'munin', 'nagios', 'emaillist', 'update', 'cron']:
	  pathHelpModule = "%s/help/%s" % (pathAnsible, module.upper())
          if os.access(pathHelpModule, os.R_OK):
            retCode = subprocess.call("less %s" % (pathHelpModule), shell=True)
            print
          else:
            print >> sys.stderr, "File %s don't exist or not readable" % (pathHelpModule)
            print >> sys.stderr

        else:
          print >> sys.stderr
          print >> sys.stderr, "Module %s not valid (Valid modules: common, hostsFile, sudo, wrappers, pamAccess, nrpe, iptables, proxmox, mycnf, apacheInc, bacula, dhcp, munin, nagios, emailList, update, cron)" % (module)
          print >> sys.stderr

      except KeyboardInterrupt:
        nodeName = ""
        print
        print "Interrupted"
        print

    elif opt == '3':
      ## Read Ansible Introduction Help ##
      if os.access(pathHelpIntro, os.R_OK):
        retCode = subprocess.call("less %s" % (pathHelpIntro), shell=True)
        print
      else:
        print >> sys.stderr, "File %s don't exist or not readable" % (pathHelpIntro)
        print >> sys.stderr

    elif opt == '4':
      ## Read System Description Help ##
      if os.access(pathHelpDescription, os.R_OK):
        retCode = subprocess.call("less %s" % (pathHelpDescription), shell=True)
        print
      else:
        print >> sys.stderr, "File %s don't exist or not readable" % (pathHelpDescription)
        print >> sys.stderr

    elif opt == '5':
      ## Read Structure Help ##
      if os.access(pathHelpStructure, os.R_OK):
        retCode = subprocess.call("less %s" % (pathHelpStructure), shell=True)
        print
      else:
        print >> sys.stderr, "File %s don't exist or not readable" % (pathHelpStructure)
        print >> sys.stderr

    elif opt == '6':
      ## Read FAQ Help ##
      if os.access(pathHelpFAQ, os.R_OK):
        retCode = subprocess.call("less %s" % (pathHelpFAQ), shell=True)
        print
      else:
        print >> sys.stderr, "File %s don't exist or not readable" % (pathHelpFAQ)
        print >> sys.stderr

    else:
      print "Option %s not valid" % (opt)

    raw_input("Press Enter to show Help Menu")



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
    sys.exit(0)



if __name__ == '__main__':
	    main()

