#!/usr/bin/perl
#
# Copyright (c) 2017 Mathieu Roy <yeupou--gnu.org>
#      http://yeupou.wordpress.com
#
#   This program is free software; you can redistribute it and/or modify
#   it under the terms of the GNU General Public License as published by
#   the Free Software Foundation; either version 2 of the License, or
#   (at your option) any later version.
#
#   This program is distributed in the hope that it will be useful,
#   but WITHOUT ANY WARRANTY; without even the implied warranty of
#   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#   GNU General Public License for more details.
#
#   You should have received a copy of the GNU General Public License
#   along with this program; if not, write to the Free Software
#   Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307
#   USA
#
#
# usermod --add-subuids 100000-165535 root
# usermod --add-subgids 100000-165535 root
#
# in LXC container config:
# lxc.id_map = u 0 100000 65536
# lxc.id_map = g 0 100000 65536
#
# that would be with --decrease=100000

use strict;
use File::Find;
use Getopt::Long;

### options
my ($getopt, $help, $path, $lxc, $decrease, $limit);
eval {
    $getopt = GetOptions("help" => \$help,
                         "lxc=s" => \$lxc,
                         "path=s" => \$path,
                         "decrease=i" => \$decrease,
                         "limit=i" => \$limit);
};

if ($help or
    !$decrease or
    (!$path and !$lxc)) {
    # decrease is mandatory
    # either path or lxc also
    # print help if missing
        print STDERR "
  Usage: $0 [OPTIONS] --lxc=name --decrease=100000
             or
         $0 [OPTIONS] --path=/directory/ --decrease=100000

Will decrease all files UID/GID by the value set.

      --lxc=name    LXC container name, will be used to determine path
      --path=/dir   No LXC assumption, just work on a given path

      --decrease=n  How much to decrement
      --limit=n     Decrease limit, by default equal to decrease

Useful for instance when you add to a LXC container such config:
  lxc.id_map = u 0 100000 65536
  lxc.id_map = g 0 100000 65536

And the host system having the relevant range set:
  usermod --add-subuids 100000-165535 root
  usermod --add-subgids 100000-165535 root

It would update UID/GID within rootfs to match the proper range. Note that
additional configured mount must also be updated accordingly, using --path
for instance.

By default, limit is set to decrease value so you can run it several time on
the same container, the decrease will be effective only once. You can set the
limit to something else, for instance if you want to decrease by 100000 a
container already within the 100000-165536 range, you would have to
use --decrease=100000 --limit=200000.

This script is primitive: it should work in most case, but if some service fail
to work after the LXC container restart, it is probably because one or several
files were missed.

Author: yeupou\@gnu.org
       http://yeupou.wordpress.com/
";
        exit;
}

# limit set to decrease by default
$limit = $decrease unless $limit;

# if lxc set, use it to define path
if ($lxc) {
    my $lxcpath = `lxc-config lxc.lxcpath`;
    chomp($lxcpath);
    $path = "$lxcpath/$lxc/rootfs";
}

# in any case, path must be given and found
die "path $path: not found, exit" unless -e $path;
print "path: $path\n";


### run
find(\&wanted, $path);

# if lxc, check main container config
if ($lxc) {
    my $lxcpath = `lxc-config lxc.lxcpath`;
    chomp($lxcpath);

    # https://unix.stackexchange.com/questions/177030/what-is-an-unprivileged-lxc-container
    # directory for the container
    chown(0,0, "$lxcpath/$lxc");
    chmod(0775, "$lxcpath/$lxc");
    # container config
    chown(0,0, "$lxcpath/$lxc/config");
    chmod(0644, "$lxcpath/$lxc/config");
    # container rootfs - chown will be done during the wanted()
    chmod(0775, "$lxcpath/$lxc/rootfs");
}


exit;

sub wanted {
    print $File::Find::name;

    # find out current UID/GID
    my $originaluid = (lstat $File::Find::name)[4];
    my $newuid = $originaluid;
    my $originalgid = (lstat $File::Find::name)[5];
    my $newgid = $originalgid;

    # increment but only if we are below the new range
    $newuid -= $decrease if ($originaluid >= $decrease);
    $newgid -= $decrease if ($originalgid >= $decrease);

    # update if there is at least one change
    if ($originaluid ne $newuid or
        $originalgid ne $newgid) {
        # Check if symbolic link
        if (-l $File::Find::name) {
          system("chown -h $newuid.$newgid $File::Find::name");
        } else {
          chown($newuid, $newgid, $File::Find::name);
        }
        print " set to UID:$newuid GID:$newgid\n";
    } else {
        print " kept to UID:$originaluid GID:$originalgid\n";
    }

}

# EOF
