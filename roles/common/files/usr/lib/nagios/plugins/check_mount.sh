#!/bin/sh
#
#  Copyright="(C) 2016 - Carlos Ijalba GPLv3" # <perkolator @ gmail.com>
#
#  This program is free software: you can redistribute it and/or modify
#  it under the terms of the GNU General Public License as published by
#  the Free Software Foundation, either version 3 of the License, or
#  (at your option) any later version.
#
#  This program is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.
#
#  You should have received a copy of the GNU General Public License
#  along with this program.  If not, see <http://www.gnu.org/licenses/>.
#
##########################################################################
#
#  Program: check_mount.sh
#
#  Parameters:
#              $1   -  FS to check --MANDATORY--
#              $2   -  Mount type  [ nfs3 | nfs4 | cifs | jfs2 | procfs | ext3 | ext4... ]  --OPTIONAL-- (NFS by default)
#
#  Output:
#              3    -  Error:    No FS passed on parameter $1.
#              2    -  CRITICAL: FS not OK, the FS specified is not mounted by $2.
#              1    -  WARNING:  FS not OK, the FS specified is mounted several times (it might not be a problem).
#              0    -  OK:       FS OK, the FS specified has an instance mounted under $2 mount type.
#
#  Description:
#
#    Shell Script for Nagios, checks if the FS passed on $1 is mounted under Mount Type $2. If no parameter passed on $2
#    NFS type is assumed by default. This script do not check fstab or /etc/filesystem or other tab entries, as it is
#    designed to consume as little CPU time as possible and to be used in different OS types.
#
#    It is a simple script, but it detects mounts of practically any type of FS, and multiple instances mounted of the same FS.
#
#    Verified compatible with the following OS:
#                                      IBM AIX v7.1, v6.1, v5.2
#                                      RHEL v6.6, v4.8, RHL v9
#                                      Ubuntu v10.04.4 LTS
#                                      SuSe v11
#                                      CentOS v6.6, v6.5
#                                      CygWin v2.5.1 & BusyBox v1.22.1
#                                      Oracle Solaris x86 v11.3, v10
#                                      SCO OpenServer v6.0.0
#                                      SCO UnixWare v7.1.4+, v7.1.4
#
#
# Versions       Date        Programmer, Modification
# ------------   ----------  ----------------------------------------------------
# Version=1.00 # 03/06/2016  Carlos Ijalba, Original version.
  Version=1.01 # 10/06/2016  Carlos Ijalba, GPLv3 open source release.
#
#########################################################################
#set -x

# Constants

 NAGIOS_ERROR=3
 NAGIOS_CRIT=2
 NAGIOS_WARN=1
 NAGIOS_OK=0


# Usage

if [ $# -lt 1 ]
  then
    cat << EOF
check_mount.sh v$Version - $Copyright

  ERROR - No FS passed under parameter \$1

     USE:
            check_mount.sh [ \$1 - Filesystem ]  | optional: [ \$2 - Type (NFS by default)]

     Reports:
            OK - \$1 mounted under \$2.
            CRITICAL - \$1 not mounted under \$2.
            WARNING - \$1 is mounted several times! (number of times mounted)

     Examples:
            check_mount.sh /developer/logs       <-- check NFS mount of /developer/logs
            check_mount.sh /developer cifs       <-- check CIFS mount of /developer
            check_mount.sh /ora12c nfs4          <-- check NFSv4 mount of /ora12c
            check_mount.sh /db2 ext3             <-- check EXT3 mount of /db2
            check_mount.sh /CICS jfs2            <-- check JFS2 mount of /CICS

EOF
    RC=$NAGIOS_ERROR
    exit $RC
fi
FS=$1


# Main

MOUNT=$2
if [ -z "$MOUNT" ]
  then
    MOUNT="nfs"         # if $2 not specified, assume NFS by default
fi

MOUNTED=`mount | grep $MOUNT | grep $FS | wc -l | tr -s " "`            # execute the command to check the mount...
if [ $MOUNTED -eq 0 ]; then
    MSG="CRITICAL - $FS not mounted under $MOUNT."
    RC=$NAGIOS_CRIT
  elif [ $MOUNTED -eq 1 ]; then
    MSG="OK - $FS mounted under $MOUNT."
    RC=$NAGIOS_OK
  else
    MSG="WARNING - $FS is mounted several times! ($MOUNTED)"
    RC=$NAGIOS_WARN
fi

echo $MSG
exit $RC

# End
