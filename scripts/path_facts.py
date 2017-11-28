#!/usr/bin/python
# The source code packaged with this file is Free Software, Copyright (C) 2016 by
# Unidad de Laboratorios, Escuela Politecnica Superior, Universidad de Alicante :: <aeps at eps.ua.es>.
# It's licensed under the AFFERO GENERAL PUBLIC LICENSE unless stated otherwise.
# You can get copies of the licenses here: http://www.affero.org/oagpl.html
# AFFERO GENERAL PUBLIC LICENSE is also included in the file called "LICENSE".


import subprocess


bash = "/bin/sh"

# Error Log file ('/dev/null' by default)
errorLog = "/dev/null"



### Functions ###

def getShell():
    ret = subprocess.Popen("(bash --version > /dev/null && ((which bash >/dev/null && which bash) || ((find /bin /sbin /usr/bin /usr/sbin /usr/local/bin /usr/local/sbin /usr/gnu/bin /usr/gnu/sbin /opt/csw/bin /opt/csw/sbin -name 'bash') || (echo '/bin/sh'))|head -1)) 2>%s" % (errorLog), shell=True, executable='/bin/sh', stdout=subprocess.PIPE).stdout.read().strip()

    if ret == "":
      ret = "/bin/sh"

    return ret


def path(command1, command2=''):
    if command1 != "" and command2 != "":
      ret = subprocess.Popen("(%s --version > /dev/null && ((which %s >/dev/null && which %s) || ((find /bin /sbin /usr/bin /usr/sbin /usr/local/bin /usr/local/sbin /usr/gnu/bin /usr/gnu/sbin /opt/csw/bin /opt/csw/sbin /root/scripts /usr/libexec /usr/lib -name '%s'|grep '%s') || (echo '%s'))|head -1) || ((which %s >/dev/null && which %s) || ((find /bin /sbin /usr/bin /usr/sbin /usr/local/bin /usr/local/sbin /usr/gnu/bin /usr/gnu/sbin /opt/csw/bin /opt/csw/sbin /root/scripts /usr/libexec /usr/lib -name '%s'|grep '%s'))|head -1 || (echo '%s'))) 2>%s" % (command1, command1, command1, command1, command1, command1, command2, command2, command2, command2, command2, errorLog), shell=True, executable='%s' % (bash), stdout=subprocess.PIPE).stdout.read().strip()
    elif command1 != "":
      ret = subprocess.Popen("((which %s >/dev/null && which %s) || ((find /bin /sbin /usr/bin /usr/sbin /usr/local/bin /usr/local/sbin /usr/gnu/bin /usr/gnu/sbin /opt/csw/bin /opt/csw/sbin /root/scripts /usr/libexec /usr/lib -name '%s'|grep '%s') || (echo '%s'))|head -1) 2>%s" % (command1, command1, command1, command1, command1, errorLog), shell=True, executable='%s' % (bash), stdout=subprocess.PIPE).stdout.read().strip()
    else:
      ret=""

    return ret


def getDaemon(d1, d2='', d3='', d4='', d5='', d6='', d7='', d8='', d9='', d10=''):
    # Getting daemons path
    data = subprocess.Popen("for i in \"%s\" \"%s\" \"%s\" \"%s\" \"%s\" \"%s\" \"%s\" \"%s\" \"%s\" \"%s\"; do val=$(([ \"$i\" != \"\" ] && (((command -v systemctl >/dev/null 2>&1 && (%s status $i || (%s -a|grep \" $i.service\"|grep \" loaded \") || (find /etc/systemd /usr/lib/systemd /lib/systemd /var/lib/systemd -name \"$i.service\"|grep \"systemd\"))) >/dev/null 2>&1 && echo \"systemctl $i\") || (command -v service >/dev/null 2>&1 && (%s $i status >/dev/null 2>&1 || [ -f /etc/init.d/$i ]) && echo \"service $i\") || ([ -f /etc/init.d/$i ] && echo \"/etc/init.d/$i\"))) 2>%s); [ \"$val\" != \"\" ] && echo \"$val\" && break; done" % (d1, d2, d3, d4, d5, d6, d7, d8, d9, d10, path('systemctl'), path('systemctl'), path('service'), errorLog), shell=True, executable='%s' % (bash), stdout=subprocess.PIPE).stdout.read().strip()

    # Get type (systemctl, service or /etc/init.d) and name
    if data.startswith('systemctl ') or data.startswith('service '):
      type = data.split(' ')[0]
      name = data.split(' ')[1]
    elif data.startswith('/etc/init.d/'):
      type = "init"
      name = data
    else:
      type = ""
      name = ""

    # Build cad for actions (stop, start, etc) 
    if type == "systemctl":
      cadAction = "%s ***ACTION*** %s" % (path(type), name)
    elif type == "service":
      cadAction = "%s %s ***ACTION***" % (path(type), name)
    elif type == "init":
      cadAction = "%s ***ACTION***" % (name)
    else:
      cadAction = ""

    # Compile info
    if type == "" or name == "" or cadAction == "":
      linit = "{\n"
      lactions = ""
      ltype = "           \"type\": \"\",\n"
      lname = "           \"name\": \"\"\n"
      lend = "         }"

    else:
      linit = "{\n"
      actions = [ 'stop', 'start', 'restart', 'reload', 'status' ]
      lactions = ""
      for act in actions:
        lactions = "%s           \"%s\": \"%s\",\n" % (lactions, act, cadAction.replace("***ACTION***","%s" % (act)))
      ltype = "           \"type\": \"%s\",\n" % (type)
      lname = "           \"name\": \"%s\"\n" % (name)
      lend = "         }"


    ret = "%s%s%s%s%s" % (linit, lactions, ltype, lname, lend)

    return ret


def show_paths():
    # Getting paths (don't use dots '.' for names)
    print "    \"path\": {"
    print "      \"commands\": {" 
    print "        \"ansible-playbook\": \"%s\"," % (path('ansible-playbook'))
    print "        \"apt-get\": \"%s\"," % (path('apt-get'))
    print "        \"apxs2\": \"%s\"," % (path('apxs2'))
    print "        \"awk\": \"%s\"," % (path('gawk','awk'))
    print "        \"basename\": \"%s\"," % (path('basename'))
    print "        \"bash\": \"%s\"," % (bash)
    print "        \"bacula-dir\": \"%s\"," % (path('bacula-dir'))
    print "        \"bacula-fd\": \"%s\"," % (path('bacula-fd'))
    print "        \"bacula-sd\": \"%s\"," % (path('bacula-sd'))
    print "        \"bconsole\": \"%s\"," % (path('bconsole'))
    print "        \"chkconfig\": \"%s\"," % (path('chkconfig'))
    print "        \"chmod\": \"%s\"," % (path('chmod'))
    print "        \"chown\": \"%s\"," % (path('chown'))
    print "        \"chroot\": \"%s\"," % (path('chroot'))
    print "        \"conary\": \"%s\"," % (path('conary'))
    print "        \"cp\": \"%s\"," % (path('cp'))
    print "        \"dhcpd\": \"%s\"," % (path('dhcpd'))
    print "        \"dirname\": \"%s\"," % (path('dirname'))
    print "        \"emerge\": \"%s\"," % (path('emerge'))
    print "        \"equery\": \"%s\"," % (path('equery'))
    print "        \"find\": \"%s\"," % (path('gfind','find'))
    print "        \"grep\": \"%s\"," % (path('ggrep','grep'))
    print "        \"installpkg\": \"%s\"," % (path('installpkg'))
    print "        \"ipmitool\": \"%s\"," % (path('ipmitool'))
    print "        \"iptables\": \"%s\"," % (path('iptables'))
    print "        \"joe\": \"%s\"," % (path('joe'))
    print "        \"killall\": \"%s\"," % (path('killall'))
    print "        \"ls\": \"%s\"," % (path('ls'))
    print "        \"mksquashfs\": \"%s\"," % (path('mksquashfs'))
    print "        \"mount\": \"%s\"," % (path('mount'))
    print "        \"mv\": \"%s\"," % (path('mv'))
    print "        \"nagios\": \"%s\"," % (path('nagios','nagios3'))
    print "        \"netstat\": \"%s\"," % (path('netstat'))
    print "        \"ntpdate\": \"%s\"," % (path('ntpdate'))
    print "        \"opensshSftpServer\": \"%s\"," % (path('sftp-server'))
    print "        \"pacman\": \"%s\"," % (path('pacman'))
    print "        \"passwd\": \"%s\"," % (path('passwd'))
    print "        \"pkg_add\": \"%s\"," % (path('pkg_add'))
    print "        \"pkg_info\": \"%s\"," % (path('pkg_info'))
    print "        \"pkgutil\": \"%s\"," % (path('pkgutil'))
    print "        \"port\": \"%s\"," % (path('port'))
    print "        \"qm\": \"%s\"," % (path('qm'))
    print "        \"qmail-qstat\": \"%s\"," % (path('qmail-qstat'))
    print "        \"quota\": \"%s\"," % (path('quota'))
    print "        \"repquota\": \"%s\"," % (path('repquota'))
    print "        \"rm\": \"%s\"," % (path('rm'))
    print "        \"route\": \"%s\"," % (path('route'))
    print "        \"rsync\": \"%s\"," % (path('rsync'))
    print "        \"sed\": \"%s\"," % (path('gsed','sed'))
    print "        \"service\": \"%s\"," % (path('service'))
    print "        \"shutdown\": \"%s\"," % (path('shutdown'))
    print "        \"ssh\": \"%s\"," % (path('ssh'))
    print "        \"ssh-keygen\": \"%s\"," % (path('ssh-keygen'))
    print "        \"sshd\": \"%s\"," % (path('sshd'))
    print "        \"svcadm\": \"%s\"," % (path('svcadm'))
    print "        \"svcs\": \"%s\"," % (path('svcs'))
    print "        \"systemctl\": \"%s\"," % (path('systemctl'))
    print "        \"tar\": \"%s\"," % (path('tar'))
    print "        \"umount\": \"%s\"," % (path('umount'))
    print "        \"uname\": \"%s\"," % (path('uname'))
    print "        \"update-rc.d\": \"%s\"," % (path('update-rc.d'))
    print "        \"vzlist\": \"%s\"," % (path('vzlist'))
    print "        \"yum\": \"%s\"," % (path('yum'))
    print "        \"zypper\": \"%s\"" % (path('zypper'))
    print "      },"
    print "      \"daemons\": {"
    print "        \"activemq\": %s," % (getDaemon('activemq'))
    print "        \"actPass\": %s," % (getDaemon('actPass'))
    print "        \"apache\": %s," % (getDaemon('httpd','apache2','apache','http')) 
    print "        \"bacula-dir\": %s," % (getDaemon('bacula-dir','bacula-director'))
    print "        \"bacula-fd\": %s," % (getDaemon('bacula-fd'))
    print "        \"bacula-sd\": %s," % (getDaemon('bacula-sd')) 
    print "        \"bind\": %s," % (getDaemon('named','bind9','bind'))
    print "        \"dhcp\": %s," % (getDaemon('dhcpd','isc-dhcp-server','dhcp3-server'))
    print "        \"dovecot\": %s," % (getDaemon('dovecot')) 
    print "        \"haproxy\": %s," % (getDaemon('haproxy'))
    print "        \"ices0\": %s," % (getDaemon('ices0'))
    print "        \"ices2\": %s," % (getDaemon('ices2'))
    print "        \"icecast2\": %s," % (getDaemon('icecast2'))
    print "        \"influxdb\": %s," % (getDaemon('influxdb'))
    print "        \"ipsec\": %s," % (getDaemon('ipsec'))
    print "        \"iptables-sh\": %s," % (getDaemon('iptables.sh'))
    print "        \"ldap\": %s," % (getDaemon('dirsrv','ldap.sh'))
    print "        \"ldap-admin\": %s," % (getDaemon('dirsrv-admin','ldap.sh'))
    print "        \"lvm\": %s," % (getDaemon('lvm2'))
    print "        \"munin-node\": %s," % (getDaemon('munin-node')) 
    print "        \"mysql\": %s," % (getDaemon('mysqld','mysql'))
    print "        \"nagios\": %s," % (getDaemon('nagios','nagios3'))
    print "        \"network\": %s," % (getDaemon('network','networking')) 
    print "        \"nfs\": %s," % (getDaemon('nfs','nfs-kernel-server'))
    print "        \"nfslock\": %s," % (getDaemon('nfslock','nfs-common'))
    print "        \"nrpe\": %s," % (getDaemon('nrpe','nagios-nrpe-server'))
    print "        \"nscd\": %s," % (getDaemon('nscd'))
    print "        \"nslcd\": %s," % (getDaemon('nslcd'))
    print "        \"ntp\": %s," % (getDaemon('ntpd','ntp'))
    print "        \"ossec\": %s," % (getDaemon('ossec'))
    print "        \"postfix\": %s," % (getDaemon('postfix'))
    print "        \"qmail\": %s," % (getDaemon('qmail'))
    print "        \"qmail-smtp-auth\": %s," % (getDaemon('qmail-smtp-auth'))
    print "        \"sshd\": %s," % (getDaemon('sshd','ssh'))
    print "        \"stunnel\": %s," % (getDaemon('stunnel','stunnel4'))
    print "        \"sudo\": %s," % (getDaemon('sudo'))
    print "        \"syslog\": %s," % (getDaemon('rsyslog','sysklogd'))
    print "        \"tomcat\": %s," % (getDaemon('tomcat'))
    print "        \"ups\": %s" % (getDaemon('ups','nut-server','nut'))
    print "      }"
    print "    },"


def show_cabecera():
    print "{"

    print "  \"ansible_facts\": {"


def show_pie():
    print "    \"changed\": false"
    print "  }"
    print "}"


def main():


    global bash

    bash = getShell()

    show_cabecera()

    show_paths()

    show_pie()



if __name__ == '__main__':
    main()

