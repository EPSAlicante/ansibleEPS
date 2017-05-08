#!/usr/bin/python

import subprocess
import sys
import os
import shutil
import datetime


# Configuration Files
pathAnsible = "/etc/ansibleEPS"
pathCentosVersion = "/etc/centos-release"
pathAnsibleLibrary = "/usr/share/ansible"
fileAnsibleCFG = "%s/ansible.cfg" % (pathAnsible)
findModArgs = "/usr/lib/python2.?/site-packages/ansible/parsing/mod_args.py"
fileTGZ = "ansibleEPS.tgz"


def main():

    # Clear screen
    os.system("clear")
    # System Installation
    print
    print "Installation of EPS Ansible Administration"
    print

    # Check Python Version
    print "Checking Python version..."
    if sys.version_info < (2, 6) or sys.version_info > (3, 0):
      print >> sys.stderr, "Python %s detected (ERROR). Python 2.6 required or greater (not 3.X)" % str(sys.version_info)
      print >> sys.stderr, "Read INSTALL help"
      print >> sys.stderr, ""
      sys.exit(1)
    else: 
      print "Python %s detected (OK)" % str(sys.version_info)

    print
    # Check Linux distribution and Version (Centos 6)
    print "Checking SO version..." 
    if os.access(pathCentosVersion, os.R_OK):
      cadVersion = subprocess.Popen("cat %s" % (pathCentosVersion), shell=True, stdout=subprocess.PIPE)
      version = cadVersion.stdout.read().split(' ')[2]
      if version.split('.')[0] != "6":
        print >> sys.stderr, ""
	print >> sys.stderr, "CentOS %s detected (ERROR). CentOS 6 required" % version
        print >> sys.stderr, "Read INSTALL help"
        print >> sys.stderr, ""
        sys.exit(2)
      else:
        print "CentOS %s detected (OK)" % version
    else:
      print >> sys.stderr, "CentOS 6 required"
      print >> sys.stderr, "Read INSTALL help"
      print >> sys.stderr, ""
      sys.exit(2)

    print
    # Check LANG environment variable (UTF-8 required)
    print "Checking LANG environment variable (UTF-8 required)..."
    cadLANG = subprocess.Popen("grep '^LANG' /etc/sysconfig/i18n|cut -d'=' -f2", shell=True, stdout=subprocess.PIPE)
    lang = cadLANG.stdout.read().strip().strip('"')
    if "UTF-8" in lang:
        print "LANG (%s) detected (OK)" % lang
    else:
        print >> sys.stderr, "LANG (%s) detected (ERROR). UTF-8 required" % lang
        print >> sys.stderr, "Read INSTALL help"
        print >> sys.stderr, ""
        sys.exit(3)

    print
    # Check Ansible package (EPEL repository enabled)
    print "Checking Ansible package (EPEL repository has to be enabled)..."
    cadAnsible = subprocess.Popen("yum list ansible 2>/dev/null|grep '^ansible'|tr -s ' '", shell=True, stdout=subprocess.PIPE)
    ansible = cadAnsible.stdout.read().strip()
    if "ansible" in ansible:
        print "Ansible package (%s) detected (OK)" % ansible
    else:
        print >> sys.stderr, "Ansible package not found (ERROR). EPEL repository enabled is required"
        print >> sys.stderr, "Read INSTALL help"
        print >> sys.stderr, ""
        sys.exit(3)

    print
    # Installing ansible
    print "Installing Ansible and dependencies"
    retCode = subprocess.call("yum -y install ansible sshpass libselinux-python", shell=True)
    if retCode == 0:
      # Looking for '/etc/ansibleEPS' directory
      if os.access(pathAnsible, os.R_OK): 
 	print
	print "%s directory detected" % pathAnsible
 	try:
	  shutil.move(pathAnsible, "%s-%s" % (pathAnsible,datetime.datetime.now().strftime("%Y%m%d%H%M%S")))
	  print "Moving %s to %s-%s" % (pathAnsible,pathAnsible,datetime.datetime.now().strftime("%Y%m%d%H%M%S"))

        except:
          print >> sys.stderr, ""
          print >> sys.stderr, "Error moving %s directory to %s-%s" % (pathAnsible,pathAnsible,datetime.datetime.now().strftime("%Y%m%d%H%M%S"))
          sys.exit(4)

      else:
        # Creating directory
        try:
          os.mkdir(pathAnsible)
          print
          print "Creating %s directory" % pathAnsible

        except:
          print >> sys.stderr, ""
          print >> sys.stderr, "Error creating %s directory" % (pathAnsible)
          sys.exit(5)

      # Installing ansibleEPS
      print
      print "Installing AnsibleEPS"
      pathTGZ = os.path.dirname(os.path.realpath(__file__))
      if os.access("%s/%s" % (pathTGZ,fileTGZ), os.R_OK): 	
        print "Unzipping %s/%s..." % (pathTGZ,fileTGZ) 
        retCode = subprocess.call("cd %s && tar xvpzf %s/%s" % (pathAnsible,pathTGZ,fileTGZ), shell=True)
        if retCode == 0:
          print
          print "AnsibleEPS installed."
          print
          print "Configuring AnsibleEPS..."
          # Create pathAnsibleLibrary directory
          if not os.path.exists(pathAnsibleLibrary):
            os.makedirs(pathAnsibleLibrary)
            print
            print "%s directory created" % (pathAnsibleLibrary)
          # Set scp_if_ssh = True in fileAnsibleCFG 
          retCode = subprocess.call("(grep '^scp_if_ssh' %s && (grep '^scp_if_ssh' %s|grep -i true || (sed -i 's/scp_if_ssh/#scp_if_ssh/' %s && false)) || sed -i 's/\[ssh_connection\]/\[ssh_connection\]\\nscp_if_ssh = True/' %s) > /dev/null" % (fileAnsibleCFG,fileAnsibleCFG,fileAnsibleCFG,fileAnsibleCFG), shell=True)	
          print
          print "'scp_if_ssh = True' verified in %s" % (fileAnsibleCFG)
          # Add db_facts in fileModArgs 
          fileModArgs =  subprocess.Popen("find %s|head -1" % (findModArgs), shell=True, stdout=subprocess.PIPE).stdout.read().strip()
          if fileModArgs != "":
            retCode = subprocess.call("(grep 'db_facts' %s || sed -i \"s/RAW_PARAM_MODULES = (\[/RAW_PARAM_MODULES = (\[\\n    'db_facts',/\" %s) > /dev/null" % (fileModArgs,fileModArgs), shell=True)
            print
            print "'db_facts' added in %s" % (fileModArgs)
          else:
            print "mod_args.py file not found"
          print
          print "AnsibleEPS configured."
          print
          print "-----------------------------------"
          print
          print "Admin Menu: /etc/ansibleEPS/menu.py"
          print
          print "-----------------------------------"

	else:
          print >> sys.stderr, ""
          print >> sys.stderr, "Error unzipping %s/%s in %s" % (pathTGZ,fileTGZ,pathAnsible)
	  sys.exit(7)

      else:
        print >> sys.stderr, ""
        print >> sys.stderr, "Error, file %s/%s not found" % (pathTGZ,fileTGZ) 
	sys.exit(6)

    else:
      print >> sys.stderr, ""
      print >> sys.stderr, "Error installing Ansible and dependencies"
      sys.exit(3)

    sys.exit(0)    





if __name__ == '__main__':
    main()


