// 2.1-1
Ext.ns('Proxmox');
Ext.ns('Proxmox.Setup');

if (!Ext.isDefined(Proxmox.Setup.auth_cookie_name)) {
    throw "Proxmox library not initialized";
}

// avoid errors related to Accessible Rich Internet Applications
// (access for people with disabilities)
// TODO reenable after all components are upgraded
Ext.enableAria = false;
Ext.enableAriaButtons = false;
Ext.enableAriaPanels = false;

// avoid errors when running without development tools
if (!Ext.isDefined(Ext.global.console)) {
    var console = {
	dir: function() {},
	log: function() {}
    };
}

Ext.Ajax.defaultHeaders = {
    'Accept': 'application/json'
};

Ext.Ajax.on('beforerequest', function(conn, options) {
    if (Proxmox.CSRFPreventionToken) {
	if (!options.headers) {
	    options.headers = {};
	}
	options.headers.CSRFPreventionToken = Proxmox.CSRFPreventionToken;
    }
});

Ext.define('Proxmox.Utils', { utilities: {

    // this singleton contains miscellaneous utilities

    yesText: gettext('Yes'),
    noText: gettext('No'),
    enabledText: gettext('Enabled'),
    disabledText: gettext('Disabled'),
    noneText: gettext('none'),
    errorText: gettext('Error'),
    unknownText: gettext('Unknown'),
    defaultText: gettext('Default'),
    daysText: gettext('days'),
    dayText: gettext('day'),
    runningText: gettext('running'),
    stoppedText: gettext('stopped'),
    neverText: gettext('never'),
    totalText: gettext('Total'),
    usedText: gettext('Used'),
    directoryText: gettext('Directory'),
    stateText: gettext('State'),
    groupText: gettext('Group'),

    language_map: {
	ca: 'Catalan',
	da: 'Danish',
	de: 'German',
	en: 'English',
	es: 'Spanish',
	eu: 'Euskera (Basque)',
	fa: 'Persian (Farsi)',
	fr: 'French',
	he: 'Hebrew',
	it: 'Italian',
	ja: 'Japanese',
	nb: 'Norwegian (Bokmal)',
	nn: 'Norwegian (Nynorsk)',
	pl: 'Polish',
	pt_BR: 'Portuguese (Brazil)',
	ru: 'Russian',
	sl: 'Slovenian',
	sv: 'Swedish',
	tr: 'Turkish',
	zh_CN: 'Chinese (Simplified)',
	zh_TW: 'Chinese (Traditional)',
    },

    render_language: function (value) {
	if (!value) {
	    return Proxmox.Utils.defaultText + ' (English)';
	}
	var text = Proxmox.Utils.language_map[value];
	if (text) {
	    return text + ' (' + value + ')';
	}
	return value;
    },

    language_array: function() {
	var data = [['__default__', Proxmox.Utils.render_language('')]];
	Ext.Object.each(Proxmox.Utils.language_map, function(key, value) {
	    data.push([key, Proxmox.Utils.render_language(value)]);
	});

	return data;
    },

    bond_mode_gettext_map: {
	'802.3ad': 'LACP (802.3ad)',
	'lacp-balance-slb': 'LACP (balance-slb)',
	'lacp-balance-tcp': 'LACP (balance-tcp)',
    },

    render_bond_mode: value => Proxmox.Utils.bond_mode_gettext_map[value] || value || '',

    bond_mode_array: function(modes) {
	return modes.map(mode => [mode, Proxmox.Utils.render_bond_mode(mode)]);
    },

    getNoSubKeyHtml: function(url) {
	// url http://www.proxmox.com/products/proxmox-ve/subscription-service-plans
	return Ext.String.format('You do not have a valid subscription for this server. Please visit <a target="_blank" href="{0}">www.proxmox.com</a> to get a list of available options.', url || 'https://www.proxmox.com');
    },

    format_boolean_with_default: function(value) {
	if (Ext.isDefined(value) && value !== '__default__') {
	    return value ? Proxmox.Utils.yesText : Proxmox.Utils.noText;
	}
	return Proxmox.Utils.defaultText;
    },

    format_boolean: function(value) {
	return value ? Proxmox.Utils.yesText : Proxmox.Utils.noText;
    },

    format_neg_boolean: function(value) {
	return !value ? Proxmox.Utils.yesText : Proxmox.Utils.noText;
    },

    format_enabled_toggle: function(value) {
	return value ? Proxmox.Utils.enabledText : Proxmox.Utils.disabledText;
    },

    format_expire: function(date) {
	if (!date) {
	    return Proxmox.Utils.neverText;
	}
	return Ext.Date.format(date, "Y-m-d");
    },

    format_duration_long: function(ut) {

	var days = Math.floor(ut / 86400);
	ut -= days*86400;
	var hours = Math.floor(ut / 3600);
	ut -= hours*3600;
	var mins = Math.floor(ut / 60);
	ut -= mins*60;

	var hours_str = '00' + hours.toString();
	hours_str = hours_str.substr(hours_str.length - 2);
	var mins_str = "00" + mins.toString();
	mins_str = mins_str.substr(mins_str.length - 2);
	var ut_str = "00" + ut.toString();
	ut_str = ut_str.substr(ut_str.length - 2);

	if (days) {
	    var ds = days > 1 ? Proxmox.Utils.daysText : Proxmox.Utils.dayText;
	    return days.toString() + ' ' + ds + ' ' +
		hours_str + ':' + mins_str + ':' + ut_str;
	} else {
	    return hours_str + ':' + mins_str + ':' + ut_str;
	}
    },

    format_subscription_level: function(level) {
	if (level === 'c') {
	    return 'Community';
	} else if (level === 'b') {
	    return 'Basic';
	} else if (level === 's') {
	    return 'Standard';
	} else if (level === 'p') {
	    return 'Premium';
	} else {
	    return Proxmox.Utils.noneText;
	}
    },

    compute_min_label_width: function(text, width) {

	if (width === undefined) { width = 100; }

	var tm = new Ext.util.TextMetrics();
	var min = tm.getWidth(text + ':');

	return min < width ? width : min;
    },

    setAuthData: function(data) {
	Proxmox.CSRFPreventionToken = data.CSRFPreventionToken;
	Proxmox.UserName = data.username;
	Proxmox.LoggedOut = data.LoggedOut;
	// creates a session cookie (expire = null)
	// that way the cookie gets deleted after the browser window is closed
	Ext.util.Cookies.set(Proxmox.Setup.auth_cookie_name, data.ticket, null, '/', null, true);
    },

    authOK: function() {
	if (Proxmox.LoggedOut) {
	    return undefined;
	}
	return (Proxmox.UserName !== '') && Ext.util.Cookies.get(Proxmox.Setup.auth_cookie_name);
    },

    authClear: function() {
	if (Proxmox.LoggedOut) {
	    return undefined;
	}
	Ext.util.Cookies.clear(Proxmox.Setup.auth_cookie_name);
    },

    // comp.setLoading() is buggy in ExtJS 4.0.7, so we
    // use el.mask() instead
    setErrorMask: function(comp, msg) {
	var el = comp.el;
	if (!el) {
	    return;
	}
	if (!msg) {
	    el.unmask();
	} else {
	    if (msg === true) {
		el.mask(gettext("Loading..."));
	    } else {
		el.mask(msg);
	    }
	}
    },

    monStoreErrors: function(me, store, clearMaskBeforeLoad) {
	if (clearMaskBeforeLoad) {
	    me.mon(store, 'beforeload', function(s, operation, eOpts) {
		Proxmox.Utils.setErrorMask(me, false);
	    });
	} else {
	    me.mon(store, 'beforeload', function(s, operation, eOpts) {
		if (!me.loadCount) {
		    me.loadCount = 0; // make sure it is numeric
		    Proxmox.Utils.setErrorMask(me, true);
		}
	    });
	}

	// only works with 'proxmox' proxy
	me.mon(store.proxy, 'afterload', function(proxy, request, success) {
	    me.loadCount++;

	    if (success) {
		Proxmox.Utils.setErrorMask(me, false);
		return;
	    }

	    var msg;
	    /*jslint nomen: true */
	    var operation = request._operation;
	    var error = operation.getError();
	    if (error.statusText) {
		msg = error.statusText + ' (' + error.status + ')';
	    } else {
		msg = gettext('Connection error');
	    }
	    Proxmox.Utils.setErrorMask(me, msg);
	});
    },

    extractRequestError: function(result, verbose) {
	var msg = gettext('Successful');

	if (!result.success) {
	    msg = gettext("Unknown error");
	    if (result.message) {
		msg = result.message;
		if (result.status) {
		    msg += ' (' + result.status + ')';
		}
	    }
	    if (verbose && Ext.isObject(result.errors)) {
		msg += "<br>";
		Ext.Object.each(result.errors, function(prop, desc) {
		    msg += "<br><b>" + Ext.htmlEncode(prop) + "</b>: " +
			Ext.htmlEncode(desc);
		});
	    }
	}

	return msg;
    },

    // Ext.Ajax.request
    API2Request: function(reqOpts) {

	var newopts = Ext.apply({
	    waitMsg: gettext('Please wait...')
	}, reqOpts);

	if (!newopts.url.match(/^\/api2/)) {
	    newopts.url = '/api2/extjs' + newopts.url;
	}
	delete newopts.callback;

	var createWrapper = function(successFn, callbackFn, failureFn) {
	    Ext.apply(newopts, {
		success: function(response, options) {
		    if (options.waitMsgTarget) {
			if (Proxmox.Utils.toolkit === 'touch') {
			    options.waitMsgTarget.setMasked(false);
			} else {
			    options.waitMsgTarget.setLoading(false);
			}
		    }
		    var result = Ext.decode(response.responseText);
		    response.result = result;
		    if (!result.success) {
			response.htmlStatus = Proxmox.Utils.extractRequestError(result, true);
			Ext.callback(callbackFn, options.scope, [options, false, response]);
			Ext.callback(failureFn, options.scope, [response, options]);
			return;
		    }
		    Ext.callback(callbackFn, options.scope, [options, true, response]);
		    Ext.callback(successFn, options.scope, [response, options]);
		},
		failure: function(response, options) {
		    if (options.waitMsgTarget) {
			if (Proxmox.Utils.toolkit === 'touch') {
			    options.waitMsgTarget.setMasked(false);
			} else {
			    options.waitMsgTarget.setLoading(false);
			}
		    }
		    response.result = {};
		    try {
			response.result = Ext.decode(response.responseText);
		    } catch(e) {}
		    var msg = gettext('Connection error') + ' - server offline?';
		    if (response.aborted) {
			msg = gettext('Connection error') + ' - aborted.';
		    } else if (response.timedout) {
			msg = gettext('Connection error') + ' - Timeout.';
		    } else if (response.status && response.statusText) {
			msg = gettext('Connection error') + ' ' + response.status + ': ' + response.statusText;
		    }
		    response.htmlStatus = msg;
		    Ext.callback(callbackFn, options.scope, [options, false, response]);
		    Ext.callback(failureFn, options.scope, [response, options]);
		}
	    });
	};

	createWrapper(reqOpts.success, reqOpts.callback, reqOpts.failure);

	var target = newopts.waitMsgTarget;
	if (target) {
	    if (Proxmox.Utils.toolkit === 'touch') {
		target.setMasked({ xtype: 'loadmask', message: newopts.waitMsg} );
	    } else {
		// Note: ExtJS bug - this does not work when component is not rendered
		target.setLoading(newopts.waitMsg);
	    }
	}
	Ext.Ajax.request(newopts);
    },

    checked_command: function(orig_cmd) {
	Proxmox.Utils.API2Request({
	    url: '/nodes/localhost/subscription',
	    method: 'GET',
	    //waitMsgTarget: me,
	    failure: function(response, opts) {
		Ext.Msg.alert(gettext('Error'), response.htmlStatus);
	    },
	    success: function(response, opts) {
		var data = response.result.data;

		if (data.status == 'Active') {
		    Ext.Msg.show({
			title: gettext('No valid subscription'),
			icon: Ext.Msg.WARNING,
			message: Proxmox.Utils.getNoSubKeyHtml(data.url),
			buttons: Ext.Msg.OK,
			callback: function(btn) {
			    if (btn !== 'ok') {
				return;
			    }
			    orig_cmd();
			}
		    });
		} else {
		    orig_cmd();
		}
	    }
	});
    },

    assemble_field_data: function(values, data) {
        if (Ext.isObject(data)) {
	    Ext.Object.each(data, function(name, val) {
		if (values.hasOwnProperty(name)) {
                    var bucket = values[name];
                    if (!Ext.isArray(bucket)) {
                        bucket = values[name] = [bucket];
                    }
                    if (Ext.isArray(val)) {
                        values[name] = bucket.concat(val);
                    } else {
                        bucket.push(val);
                    }
                } else {
		    values[name] = val;
                }
            });
	}
    },

    dialog_title: function(subject, create, isAdd) {
	if (create) {
	    if (isAdd) {
		return gettext('Add') + ': ' + subject;
	    } else {
		return gettext('Create') + ': ' + subject;
	    }
	} else {
	    return gettext('Edit') + ': ' + subject;
	}
    },

    network_iface_types: {
	eth: gettext("Network Device"),
	bridge: 'Linux Bridge',
	bond: 'Linux Bond',
	vlan: 'Linux VLAN',
	OVSBridge: 'OVS Bridge',
	OVSBond: 'OVS Bond',
	OVSPort: 'OVS Port',
	OVSIntPort: 'OVS IntPort'
    },

    render_network_iface_type: function(value) {
	return Proxmox.Utils.network_iface_types[value] ||
	    Proxmox.Utils.unknownText;
    },

    task_desc_table: {
	acmenewcert: [ 'SRV', gettext('Order Certificate') ],
	acmeregister: [ 'ACME Account', gettext('Register') ],
	acmedeactivate: [ 'ACME Account', gettext('Deactivate') ],
	acmeupdate: [ 'ACME Account', gettext('Update') ],
	acmerefresh: [ 'ACME Account', gettext('Refresh') ],
	acmerenew: [ 'SRV', gettext('Renew Certificate') ],
	acmerevoke: [ 'SRV', gettext('Revoke Certificate') ],
	'move_volume': [ 'CT', gettext('Move Volume') ],
	clustercreate: [ '', gettext('Create Cluster') ],
	clusterjoin: [ '', gettext('Join Cluster') ],
	diskinit: [ 'Disk', gettext('Initialize Disk with GPT') ],
	vncproxy: [ 'VM/CT', gettext('Console') ],
	spiceproxy: [ 'VM/CT', gettext('Console') + ' (Spice)' ],
	vncshell: [ '', gettext('Shell') ],
	spiceshell: [ '', gettext('Shell')  + ' (Spice)' ],
	qmsnapshot: [ 'VM', gettext('Snapshot') ],
	qmrollback: [ 'VM', gettext('Rollback') ],
	qmdelsnapshot: [ 'VM', gettext('Delete Snapshot') ],
	qmcreate: [ 'VM', gettext('Create') ],
	qmrestore: [ 'VM', gettext('Restore') ],
	qmdestroy: [ 'VM', gettext('Destroy') ],
	qmigrate: [ 'VM', gettext('Migrate') ],
	qmclone: [ 'VM', gettext('Clone') ],
	qmmove: [ 'VM', gettext('Move disk') ],
	qmtemplate: [ 'VM', gettext('Convert to template') ],
	qmstart: [ 'VM', gettext('Start') ],
	qmstop: [ 'VM', gettext('Stop') ],
	qmreset: [ 'VM', gettext('Reset') ],
	qmshutdown: [ 'VM', gettext('Shutdown') ],
	qmreboot: [ 'VM', gettext('Reboot') ],
	qmsuspend: [ 'VM', gettext('Hibernate') ],
	qmpause: [ 'VM', gettext('Pause') ],
	qmresume: [ 'VM', gettext('Resume') ],
	qmconfig: [ 'VM', gettext('Configure') ],
	vzsnapshot: [ 'CT', gettext('Snapshot') ],
	vzrollback: [ 'CT', gettext('Rollback') ],
	vzdelsnapshot: [ 'CT', gettext('Delete Snapshot') ],
	vzcreate: ['CT', gettext('Create') ],
	vzrestore: ['CT', gettext('Restore') ],
	vzdestroy: ['CT', gettext('Destroy') ],
	vzmigrate: [ 'CT', gettext('Migrate') ],
	vzclone: [ 'CT', gettext('Clone') ],
	vztemplate: [ 'CT', gettext('Convert to template') ],
	vzstart: ['CT', gettext('Start') ],
	vzstop: ['CT', gettext('Stop') ],
	vzmount: ['CT', gettext('Mount') ],
	vzumount: ['CT', gettext('Unmount') ],
	vzshutdown: ['CT', gettext('Shutdown') ],
	vzreboot: ['CT', gettext('Reboot') ],
	vzsuspend: [ 'CT', gettext('Suspend') ],
	vzresume: [ 'CT', gettext('Resume') ],
	hamigrate: [ 'HA', gettext('Migrate') ],
	hastart: [ 'HA', gettext('Start') ],
	hastop: [ 'HA', gettext('Stop') ],
	srvstart: ['SRV', gettext('Start') ],
	srvstop: ['SRV', gettext('Stop') ],
	srvrestart: ['SRV', gettext('Restart') ],
	srvreload: ['SRV', gettext('Reload') ],
	cephcreatemgr: ['Ceph Manager', gettext('Create') ],
	cephdestroymgr: ['Ceph Manager', gettext('Destroy') ],
	cephcreatemon: ['Ceph Monitor', gettext('Create') ],
	cephdestroymon: ['Ceph Monitor', gettext('Destroy') ],
	cephcreateosd: ['Ceph OSD', gettext('Create') ],
	cephdestroyosd: ['Ceph OSD', gettext('Destroy') ],
	cephcreatepool: ['Ceph Pool', gettext('Create') ],
	cephdestroypool: ['Ceph Pool', gettext('Destroy') ],
	cephfscreate: ['CephFS', gettext('Create') ],
	cephcreatemds: ['Ceph Metadata Server', gettext('Create') ],
	cephdestroymds: ['Ceph Metadata Server', gettext('Destroy') ],
	imgcopy: ['', gettext('Copy data') ],
	imgdel: ['', gettext('Erase data') ],
	unknownimgdel: ['', gettext('Destroy image from unknown guest') ],
	download: ['', gettext('Download') ],
	vzdump: ['VM/CT', gettext('Backup') ],
	aptupdate: ['', gettext('Update package database') ],
	startall: [ '', gettext('Start all VMs and Containers') ],
	stopall: [ '', gettext('Stop all VMs and Containers') ],
	migrateall: [ '', gettext('Migrate all VMs and Containers') ],
	dircreate: [ gettext('Directory Storage'), gettext('Create') ],
	lvmcreate: [ gettext('LVM Storage'), gettext('Create') ],
	lvmthincreate: [ gettext('LVM-Thin Storage'), gettext('Create') ],
	zfscreate: [ gettext('ZFS Storage'), gettext('Create') ]
    },

    format_task_description: function(type, id) {
	var farray = Proxmox.Utils.task_desc_table[type];
	var text;
	if (!farray) {
	    text = type;
	    if (id) {
		type += ' ' + id;
	    }
	    return text;
	}
	var prefix = farray[0];
	text = farray[1];
	if (prefix) {
	    return prefix + ' ' + id + ' - ' + text;
	}
	return text;
    },

    format_size: function(size) {
	/*jslint confusion: true */

	var units = ['', 'Ki', 'Mi', 'Gi', 'Ti', 'Pi', 'Ei', 'Zi', 'Yi'];
	var num = 0;

	while (size >= 1024 && ((num++)+1) < units.length) {
	    size = size / 1024;
	}

	return size.toFixed((num > 0)?2:0) + " " + units[num] + "B";
    },

    render_upid: function(value, metaData, record) {
	var type = record.data.type;
	var id = record.data.id;

	return Proxmox.Utils.format_task_description(type, id);
    },

    render_uptime: function(value) {

	var uptime = value;

	if (uptime === undefined) {
	    return '';
	}

	if (uptime <= 0) {
	    return '-';
	}

	return Proxmox.Utils.format_duration_long(uptime);
    },

    parse_task_upid: function(upid) {
	var task = {};

	var res = upid.match(/^UPID:(\S+):([0-9A-Fa-f]{8}):([0-9A-Fa-f]{8,9}):([0-9A-Fa-f]{8}):([^:\s]+):([^:\s]*):([^:\s]+):$/);
	if (!res) {
	    throw "unable to parse upid '" + upid + "'";
	}
	task.node = res[1];
	task.pid = parseInt(res[2], 16);
	task.pstart = parseInt(res[3], 16);
	task.starttime = parseInt(res[4], 16);
	task.type = res[5];
	task.id = res[6];
	task.user = res[7];

	task.desc = Proxmox.Utils.format_task_description(task.type, task.id);

	return task;
    },

    render_timestamp: function(value, metaData, record, rowIndex, colIndex, store) {
	var servertime = new Date(value * 1000);
	return Ext.Date.format(servertime, 'Y-m-d H:i:s');
    },

    get_help_info: function(section) {
	var helpMap;
	if (typeof proxmoxOnlineHelpInfo !== 'undefined') {
	    helpMap = proxmoxOnlineHelpInfo;
	} else if (typeof pveOnlineHelpInfo !== 'undefined') {
	    // be backward compatible with older pve-doc-generators
	    helpMap = pveOnlineHelpInfo;
	} else {
	    throw "no global OnlineHelpInfo map declared";
	}

	return helpMap[section];
    },

    get_help_link: function(section) {
	var info = Proxmox.Utils.get_help_info(section);
	if (!info) {
	    return;
	}

	return window.location.origin + info.link;
    },

    openXtermJsViewer: function(vmtype, vmid, nodename, vmname, cmd) {
	var url = Ext.Object.toQueryString({
	    console: vmtype, // kvm, lxc, upgrade or shell
	    xtermjs: 1,
	    vmid: vmid,
	    vmname: vmname,
	    node: nodename,
	    cmd: cmd,

	});
	var nw = window.open("?" + url, '_blank', 'toolbar=no,location=no,status=no,menubar=no,resizable=yes,width=800,height=420');
	if (nw) {
	    nw.focus();
	}
    }

},

    singleton: true,
    constructor: function() {
	var me = this;
	Ext.apply(me, me.utilities);

	var IPV4_OCTET = "(?:25[0-5]|(?:[1-9]|1[0-9]|2[0-4])?[0-9])";
	var IPV4_REGEXP = "(?:(?:" + IPV4_OCTET + "\\.){3}" + IPV4_OCTET + ")";
	var IPV6_H16 = "(?:[0-9a-fA-F]{1,4})";
	var IPV6_LS32 = "(?:(?:" + IPV6_H16 + ":" + IPV6_H16 + ")|" + IPV4_REGEXP + ")";
	var IPV4_CIDR_MASK = "([0-9]{1,2})";
	var IPV6_CIDR_MASK = "([0-9]{1,3})";


	me.IP4_match = new RegExp("^(?:" + IPV4_REGEXP + ")$");
	me.IP4_cidr_match = new RegExp("^(?:" + IPV4_REGEXP + ")\/" + IPV4_CIDR_MASK + "$");

	var IPV6_REGEXP = "(?:" +
	    "(?:(?:"                                                  + "(?:" + IPV6_H16 + ":){6})" + IPV6_LS32 + ")|" +
	    "(?:(?:"                                         +   "::" + "(?:" + IPV6_H16 + ":){5})" + IPV6_LS32 + ")|" +
	    "(?:(?:(?:"                           + IPV6_H16 + ")?::" + "(?:" + IPV6_H16 + ":){4})" + IPV6_LS32 + ")|" +
	    "(?:(?:(?:(?:" + IPV6_H16 + ":){0,1}" + IPV6_H16 + ")?::" + "(?:" + IPV6_H16 + ":){3})" + IPV6_LS32 + ")|" +
	    "(?:(?:(?:(?:" + IPV6_H16 + ":){0,2}" + IPV6_H16 + ")?::" + "(?:" + IPV6_H16 + ":){2})" + IPV6_LS32 + ")|" +
	    "(?:(?:(?:(?:" + IPV6_H16 + ":){0,3}" + IPV6_H16 + ")?::" + "(?:" + IPV6_H16 + ":){1})" + IPV6_LS32 + ")|" +
	    "(?:(?:(?:(?:" + IPV6_H16 + ":){0,4}" + IPV6_H16 + ")?::" +                         ")" + IPV6_LS32 + ")|" +
	    "(?:(?:(?:(?:" + IPV6_H16 + ":){0,5}" + IPV6_H16 + ")?::" +                         ")" + IPV6_H16  + ")|" +
	    "(?:(?:(?:(?:" + IPV6_H16 + ":){0,7}" + IPV6_H16 + ")?::" +                         ")"             + ")"  +
	    ")";

	me.IP6_match = new RegExp("^(?:" + IPV6_REGEXP + ")$");
	me.IP6_cidr_match = new RegExp("^(?:" + IPV6_REGEXP + ")\/" + IPV6_CIDR_MASK + "$");
	me.IP6_bracket_match = new RegExp("^\\[(" + IPV6_REGEXP + ")\\]");

	me.IP64_match = new RegExp("^(?:" + IPV6_REGEXP + "|" + IPV4_REGEXP + ")$");
	me.IP64_cidr_match = new RegExp("^(?:" + IPV6_REGEXP + "\/" + IPV6_CIDR_MASK + ")|(?:" + IPV4_REGEXP + "\/" + IPV4_CIDR_MASK + ")$");

	var DnsName_REGEXP = "(?:(([a-zA-Z0-9]([a-zA-Z0-9\\-]*[a-zA-Z0-9])?)\\.)*([A-Za-z0-9]([A-Za-z0-9\\-]*[A-Za-z0-9])?))";
	me.DnsName_match = new RegExp("^" + DnsName_REGEXP + "$");

	me.HostPort_match = new RegExp("^(" + IPV4_REGEXP + "|" + DnsName_REGEXP + ")(:\\d+)?$");
	me.HostPortBrackets_match = new RegExp("^\\[(?:" + IPV6_REGEXP + "|" + IPV4_REGEXP + "|" + DnsName_REGEXP + ")\\](:\\d+)?$");
	me.IP6_dotnotation_match = new RegExp("^" + IPV6_REGEXP + "(\\.\\d+)?$");
    }
});
// ExtJS related things

 // do not send '_dc' parameter
Ext.Ajax.disableCaching = false;

// custom Vtypes
Ext.apply(Ext.form.field.VTypes, {
    IPAddress:  function(v) {
	return Proxmox.Utils.IP4_match.test(v);
    },
    IPAddressText:  gettext('Example') + ': 192.168.1.1',
    IPAddressMask: /[\d\.]/i,

    IPCIDRAddress:  function(v) {
	var result = Proxmox.Utils.IP4_cidr_match.exec(v);
	// limits according to JSON Schema see
	// pve-common/src/PVE/JSONSchema.pm
	return (result !== null && result[1] >= 8 && result[1] <= 32);
    },
    IPCIDRAddressText:  gettext('Example') + ': 192.168.1.1/24' + "<br>" + gettext('Valid CIDR Range') + ': 8-32',
    IPCIDRAddressMask: /[\d\.\/]/i,

    IP6Address:  function(v) {
        return Proxmox.Utils.IP6_match.test(v);
    },
    IP6AddressText:  gettext('Example') + ': 2001:DB8::42',
    IP6AddressMask: /[A-Fa-f0-9:]/,

    IP6CIDRAddress:  function(v) {
	var result = Proxmox.Utils.IP6_cidr_match.exec(v);
	// limits according to JSON Schema see
	// pve-common/src/PVE/JSONSchema.pm
	return (result !== null && result[1] >= 8 && result[1] <= 128);
    },
    IP6CIDRAddressText:  gettext('Example') + ': 2001:DB8::42/64' + "<br>" + gettext('Valid CIDR Range') + ': 8-128',
    IP6CIDRAddressMask:  /[A-Fa-f0-9:\/]/,

    IP6PrefixLength:  function(v) {
	return v >= 0 && v <= 128;
    },
    IP6PrefixLengthText:  gettext('Example') + ': X, where 0 <= X <= 128',
    IP6PrefixLengthMask:  /[0-9]/,

    IP64Address:  function(v) {
        return Proxmox.Utils.IP64_match.test(v);
    },
    IP64AddressText:  gettext('Example') + ': 192.168.1.1 2001:DB8::42',
    IP64AddressMask: /[A-Fa-f0-9\.:]/,

    IP64CIDRAddress: function(v) {
	var result = Proxmox.Utils.IP64_cidr_match.exec(v);
	if (result === null) {
	    return false;
	}
	if (result[1] !== undefined) {
	    return result[1] >= 8 && result[1] <= 128;
	} else if (result[2] !== undefined) {
	    return result[2] >= 8 && result[2] <= 32;
	} else {
	    return false;
	}
    },
    IP64CIDRAddressText: gettext('Example') + ': 192.168.1.1/24 2001:DB8::42/64',
    IP64CIDRAddressMask: /[A-Fa-f0-9\.:\/]/,

    MacAddress: function(v) {
	return (/^([a-fA-F0-9]{2}:){5}[a-fA-F0-9]{2}$/).test(v);
    },
    MacAddressMask: /[a-fA-F0-9:]/,
    MacAddressText: gettext('Example') + ': 01:23:45:67:89:ab',

    MacPrefix:  function(v) {
	return (/^[a-f0-9][02468ace](?::[a-f0-9]{2}){0,2}:?$/i).test(v);
    },
    MacPrefixMask: /[a-fA-F0-9:]/,
    MacPrefixText: gettext('Example') + ': 02:8f - ' + gettext('only unicast addresses are allowed'),

    BridgeName: function(v) {
        return (/^vmbr\d{1,4}$/).test(v);
    },
    BridgeNameText: gettext('Format') + ': vmbr<b>N</b>, where 0 <= <b>N</b> <= 9999',

    BondName: function(v) {
        return (/^bond\d{1,4}$/).test(v);
    },
    BondNameText: gettext('Format') + ': bond<b>N</b>, where 0 <= <b>N</b> <= 9999',

    InterfaceName: function(v) {
        return (/^[a-z][a-z0-9_]{1,20}$/).test(v);
    },
    InterfaceNameText: gettext("Allowed characters") + ": 'a-z', '0-9', '_'" + "<br />" +
		       gettext("Minimum characters") + ": 2" + "<br />" +
		       gettext("Maximum characters") + ": 21" + "<br />" +
		       gettext("Must start with") + ": 'a-z'",

    StorageId:  function(v) {
        return (/^[a-z][a-z0-9\-\_\.]*[a-z0-9]$/i).test(v);
    },
    StorageIdText: gettext("Allowed characters") + ":  'A-Z', 'a-z', '0-9', '-', '_', '.'" + "<br />" +
		   gettext("Minimum characters") + ": 2" + "<br />" +
		   gettext("Must start with") + ": 'A-Z', 'a-z'<br />" +
		   gettext("Must end with") + ": 'A-Z', 'a-z', '0-9'<br />",

    ConfigId:  function(v) {
        return (/^[a-z][a-z0-9\_]+$/i).test(v);
    },
    ConfigIdText: gettext("Allowed characters") + ": 'A-Z', 'a-z', '0-9', '_'" + "<br />" +
		  gettext("Minimum characters") + ": 2" + "<br />" +
		  gettext("Must start with") + ": " + gettext("letter"),

    HttpProxy:  function(v) {
        return (/^http:\/\/.*$/).test(v);
    },
    HttpProxyText: gettext('Example') + ": http://username:password&#64;host:port/",

    DnsName: function(v) {
	return Proxmox.Utils.DnsName_match.test(v);
    },
    DnsNameText: gettext('This is not a valid DNS name'),

    // workaround for https://www.sencha.com/forum/showthread.php?302150
    proxmoxMail: function(v) {
        return (/^(\w+)([\-+.][\w]+)*@(\w[\-\w]*\.){1,5}([A-Za-z]){2,63}$/).test(v);
    },
    proxmoxMailText: gettext('Example') + ": user@example.com",

    DnsOrIp: function(v) {
	if (!Proxmox.Utils.DnsName_match.test(v) &&
	    !Proxmox.Utils.IP64_match.test(v)) {
	    return false;
	}

	return true;
    },
    DnsOrIpText: gettext('Not a valid DNS name or IP address.'),

    HostList: function(v) {
	var list = v.split(/[\ \,\;]+/);
	var i;
	for (i = 0; i < list.length; i++) {
	    if (list[i] == "") {
		continue;
	    }

	    if (!Proxmox.Utils.HostPort_match.test(list[i]) &&
		!Proxmox.Utils.HostPortBrackets_match.test(list[i]) &&
		!Proxmox.Utils.IP6_dotnotation_match.test(list[i])) {
		return false;
	    }
	}

	return true;
    },
    HostListText: gettext('Not a valid list of hosts'),

    password: function(val, field) {
        if (field.initialPassField) {
            var pwd = field.up('form').down(
		'[name=' + field.initialPassField + ']');
            return (val == pwd.getValue());
        }
        return true;
    },

    passwordText: gettext('Passwords do not match')
});

// Firefox 52+ Touchscreen bug
// see https://www.sencha.com/forum/showthread.php?336762-Examples-don-t-work-in-Firefox-52-touchscreen/page2
// and https://bugzilla.proxmox.com/show_bug.cgi?id=1223
Ext.define('EXTJS_23846.Element', {
    override: 'Ext.dom.Element'
}, function(Element) {
    var supports = Ext.supports,
        proto = Element.prototype,
        eventMap = proto.eventMap,
        additiveEvents = proto.additiveEvents;

    if (Ext.os.is.Desktop && supports.TouchEvents && !supports.PointerEvents) {
        eventMap.touchstart = 'mousedown';
        eventMap.touchmove = 'mousemove';
        eventMap.touchend = 'mouseup';
        eventMap.touchcancel = 'mouseup';

        additiveEvents.mousedown = 'mousedown';
        additiveEvents.mousemove = 'mousemove';
        additiveEvents.mouseup = 'mouseup';
        additiveEvents.touchstart = 'touchstart';
        additiveEvents.touchmove = 'touchmove';
        additiveEvents.touchend = 'touchend';
        additiveEvents.touchcancel = 'touchcancel';

        additiveEvents.pointerdown = 'mousedown';
        additiveEvents.pointermove = 'mousemove';
        additiveEvents.pointerup = 'mouseup';
        additiveEvents.pointercancel = 'mouseup';
    }
});

Ext.define('EXTJS_23846.Gesture', {
    override: 'Ext.event.publisher.Gesture'
}, function(Gesture) {
    var me = Gesture.instance;

    if (Ext.supports.TouchEvents && !Ext.isWebKit && Ext.os.is.Desktop) {
        me.handledDomEvents.push('mousedown', 'mousemove', 'mouseup');
        me.registerEvents();
    }
});

Ext.define('EXTJS_18900.Pie', {
    override: 'Ext.chart.series.Pie',

    // from 6.0.2
    betweenAngle: function (x, a, b) {
        var pp = Math.PI * 2,
            offset = this.rotationOffset;

        if (a === b) {
            return false;
        }

        if (!this.getClockwise()) {
            x *= -1;
            a *= -1;
            b *= -1;
            a -= offset;
            b -= offset;
        } else {
            a += offset;
            b += offset;
        }

        x -= a;
        b -= a;

        // Normalize, so that both x and b are in the [0,360) interval.
        x %= pp;
        b %= pp;
        x += pp;
        b += pp;
        x %= pp;
        b %= pp;

        // Because 360 * n angles will be normalized to 0,
        // we need to treat b === 0 as a special case.
        return x < b || b === 0;
    },
});

// we always want the number in x.y format and never in, e.g., x,y
Ext.define('PVE.form.field.Number', {
    override: 'Ext.form.field.Number',
    submitLocaleSeparator: false
});

// ExtJs 5-6 has an issue with caching
// see https://www.sencha.com/forum/showthread.php?308989
Ext.define('Proxmox.UnderlayPool', {
    override: 'Ext.dom.UnderlayPool',

    checkOut: function () {
        var cache = this.cache,
            len = cache.length,
            el;

        // do cleanup because some of the objects might have been destroyed
	while (len--) {
            if (cache[len].destroyed) {
                cache.splice(len, 1);
            }
        }
        // end do cleanup

	el = cache.shift();

        if (!el) {
            el = Ext.Element.create(this.elementConfig);
            el.setVisibilityMode(2);
            //<debug>
            // tell the spec runner to ignore this element when checking if the dom is clean
	    el.dom.setAttribute('data-sticky', true);
            //</debug>
	}

        return el;
    }
});

// 'Enter' in Textareas and aria multiline fields should not activate the
// defaultbutton, fixed in extjs 6.0.2
Ext.define('PVE.panel.Panel', {
    override: 'Ext.panel.Panel',

    fireDefaultButton: function(e) {
	if (e.target.getAttribute('aria-multiline') === 'true' ||
	    e.target.tagName === "TEXTAREA") {
	    return true;
	}
	return this.callParent(arguments);
    }
});

// if the order of the values are not the same in originalValue and value
// extjs will not overwrite value, but marks the field dirty and thus
// the reset button will be enabled (but clicking it changes nothing)
// so if the arrays are not the same after resetting, we
// clear and set it
Ext.define('Proxmox.form.ComboBox', {
    override: 'Ext.form.field.ComboBox',

    reset: function() {
	// copied from combobox
	var me = this;
	me.callParent();

	// clear and set when not the same
	var value = me.getValue();
	if (Ext.isArray(me.originalValue) && Ext.isArray(value) && !Ext.Array.equals(value, me.originalValue)) {
	    me.clearValue();
	    me.setValue(me.originalValue);
	}
    }
});

// when refreshing a grid/tree view, restoring the focus moves the view back to
// the previously focused item. Save scroll position before refocusing.
Ext.define(null, {
    override: 'Ext.view.Table',

    jumpToFocus: false,

    saveFocusState: function() {
        var me = this,
            store = me.dataSource,
            actionableMode = me.actionableMode,
            navModel = me.getNavigationModel(),
            focusPosition = actionableMode ? me.actionPosition : navModel.getPosition(true),
            refocusRow, refocusCol;

        if (focusPosition) {
            // Separate this from the instance that the nav model is using.
            focusPosition = focusPosition.clone();

            // Exit actionable mode.
            // We must inform any Actionables that they must relinquish control.
            // Tabbability must be reset.
            if (actionableMode) {
                me.ownerGrid.setActionableMode(false);
            }

            // Blur the focused descendant, but do not trigger focusLeave.
            me.el.dom.focus();

            // Exiting actionable mode navigates to the owning cell, so in either focus mode we must
            // clear the navigation position
            navModel.setPosition();

            // The following function will attempt to refocus back in the same mode to the same cell
            // as it was at before based upon the previous record (if it's still inthe store), or the row index.
            return function() {
                // If we still have data, attempt to refocus in the same mode.
                if (store.getCount()) {

                    // Adjust expectations of where we are able to refocus according to what kind of destruction
                    // might have been wrought on this view's DOM during focus save.
                    refocusRow = Math.min(focusPosition.rowIdx, me.all.getCount() - 1);
                    refocusCol = Math.min(focusPosition.colIdx, me.getVisibleColumnManager().getColumns().length - 1);
                    focusPosition = new Ext.grid.CellContext(me).setPosition(
                            store.contains(focusPosition.record) ? focusPosition.record : refocusRow, refocusCol);

                    if (actionableMode) {
                        me.ownerGrid.setActionableMode(true, focusPosition);
                    } else {
                        me.cellFocused = true;

			// we sometimes want to scroll back to where we were
			var x = me.getScrollX();
			var y = me.getScrollY();

                        // Pass "preventNavigation" as true so that that does not cause selection.
                        navModel.setPosition(focusPosition, null, null, null, true);

			if (!me.jumpToFocus) {
			    me.scrollTo(x,y);
			}
                    }
                }
                // No rows - focus associated column header
                else {
                    focusPosition.column.focus();
                }
            };
        }
        return Ext.emptyFn;
    }
});

// should be fixed with ExtJS 6.0.2, see:
// https://www.sencha.com/forum/showthread.php?307244-Bug-with-datefield-in-window-with-scroll
Ext.define('Proxmox.Datepicker', {
    override: 'Ext.picker.Date',
    hideMode: 'visibility'
});

// ExtJS 6.0.1 has no setSubmitValue() (although you find it in the docs).
// Note: this.submitValue is a boolean flag, whereas getSubmitValue() returns
// data to be submitted.
Ext.define('Proxmox.form.field.Text', {
    override: 'Ext.form.field.Text',

    setSubmitValue: function(v) {
	this.submitValue = v;
    },
});

// this should be fixed with ExtJS 6.0.2
// make mousescrolling work in firefox in the containers overflowhandler
Ext.define(null, {
    override: 'Ext.layout.container.boxOverflow.Scroller',

    createWheelListener: function() {
	var me = this;
	if (Ext.isFirefox) {
	    me.wheelListener = me.layout.innerCt.on('wheel', me.onMouseWheelFirefox, me, {destroyable: true});
	} else {
	    me.wheelListener = me.layout.innerCt.on('mousewheel', me.onMouseWheel, me, {destroyable: true});
	}
    },

    // special wheel handler for firefox. differs from the default onMouseWheel
    // handler by using deltaY instead of wheelDeltaY and no normalizing,
    // because it is already
    onMouseWheelFirefox: function(e) {
	e.stopEvent();
	var delta = e.browserEvent.deltaY || 0;
	this.scrollBy(delta * this.wheelIncrement, false);
    }

});

// add '@' to the valid id
Ext.define('Proxmox.validIdReOverride', {
    override: 'Ext.Component',
    validIdRe: /^[a-z_][a-z0-9\-_\@]*$/i,
});

// force alert boxes to be rendered with an Error Icon
// since Ext.Msg is an object and not a prototype, we need to override it
// after the framework has been initiated
Ext.onReady(function() {
/*jslint confusion: true */
    Ext.override(Ext.Msg, {
	alert: function(title, message, fn, scope) {
	    if (Ext.isString(title)) {
		var config = {
		    title: title,
		    message: message,
		    icon: this.ERROR,
		    buttons: this.OK,
		    fn: fn,
		    scope : scope,
		    minWidth: this.minWidth
		};
	    return this.show(config);
	    }
	}
    });
/*jslint confusion: false */
});
Ext.define('Ext.ux.IFrame', {
    extend: 'Ext.Component',

    alias: 'widget.uxiframe',

    loadMask: 'Loading...',

    src: 'about:blank',

    renderTpl: [
        '<iframe src="{src}" id="{id}-iframeEl" data-ref="iframeEl" name="{frameName}" width="100%" height="100%" frameborder="0" allowfullscreen="true"></iframe>'
    ],
    childEls: ['iframeEl'],

    initComponent: function () {
        this.callParent();

        this.frameName = this.frameName || this.id + '-frame';
    },

    initEvents : function() {
        var me = this;
        me.callParent();
        me.iframeEl.on('load', me.onLoad, me);
    },

    initRenderData: function() {
        return Ext.apply(this.callParent(), {
            src: this.src,
            frameName: this.frameName
        });
    },

    getBody: function() {
        var doc = this.getDoc();
        return doc.body || doc.documentElement;
    },

    getDoc: function() {
        try {
            return this.getWin().document;
        } catch (ex) {
            return null;
        }
    },

    getWin: function() {
        var me = this,
            name = me.frameName,
            win = Ext.isIE
                ? me.iframeEl.dom.contentWindow
                : window.frames[name];
        return win;
    },

    getFrame: function() {
        var me = this;
        return me.iframeEl.dom;
    },

    beforeDestroy: function () {
        this.cleanupListeners(true);
        this.callParent();
    },

    cleanupListeners: function(destroying){
        var doc, prop;

        if (this.rendered) {
            try {
                doc = this.getDoc();
                if (doc) {
		    /*jslint nomen: true*/
                    Ext.get(doc).un(this._docListeners);
		    /*jslint nomen: false*/
                    if (destroying && doc.hasOwnProperty) {
                        for (prop in doc) {
                            if (doc.hasOwnProperty(prop)) {
                                delete doc[prop];
                            }
                        }
                    }
                }
            } catch(e) { }
        }
    },

    onLoad: function() {
        var me = this,
            doc = me.getDoc(),
            fn = me.onRelayedEvent;

        if (doc) {
            try {
                // These events need to be relayed from the inner document (where they stop
                // bubbling) up to the outer document. This has to be done at the DOM level so
                // the event reaches listeners on elements like the document body. The effected
                // mechanisms that depend on this bubbling behavior are listed to the right
                // of the event.
		/*jslint nomen: true*/
                Ext.get(doc).on(
                    me._docListeners = {
                        mousedown: fn, // menu dismisal (MenuManager) and Window onMouseDown (toFront)
                        mousemove: fn, // window resize drag detection
                        mouseup: fn,   // window resize termination
                        click: fn,     // not sure, but just to be safe
                        dblclick: fn,  // not sure again
                        scope: me
                    }
                );
		/*jslint nomen: false*/
            } catch(e) {
                // cannot do this xss
            }

            // We need to be sure we remove all our events from the iframe on unload or we're going to LEAK!
            Ext.get(this.getWin()).on('beforeunload', me.cleanupListeners, me);

            this.el.unmask();
            this.fireEvent('load', this);

        } else if (me.src) {

            this.el.unmask();
            this.fireEvent('error', this);
        }


    },

    onRelayedEvent: function (event) {
        // relay event from the iframe's document to the document that owns the iframe...

        var iframeEl = this.iframeEl,

            // Get the left-based iframe position
            iframeXY = iframeEl.getTrueXY(),
            originalEventXY = event.getXY(),

            // Get the left-based XY position.
            // This is because the consumer of the injected event will
            // perform its own RTL normalization.
            eventXY = event.getTrueXY();

        // the event from the inner document has XY relative to that document's origin,
        // so adjust it to use the origin of the iframe in the outer document:
        event.xy = [iframeXY[0] + eventXY[0], iframeXY[1] + eventXY[1]];

        event.injectEvent(iframeEl); // blame the iframe for the event...

        event.xy = originalEventXY; // restore the original XY (just for safety)
    },

    load: function (src) {
        var me = this,
            text = me.loadMask,
            frame = me.getFrame();

        if (me.fireEvent('beforeload', me, src) !== false) {
            if (text && me.el) {
                me.el.mask(text);
            }

            frame.src = me.src = (src || me.src);
        }
    }
});
Ext.define('Proxmox.Mixin.CBind', {
    extend: 'Ext.Mixin',

    mixinConfig: {
        before: {
            initComponent: 'cloneTemplates'
        }
    },

    cloneTemplates: function() {
	var me = this;

 	if (typeof(me.cbindData) == "function") {
	    me.cbindData = me.cbindData(me.initialConfig) || {};
	}

	var getConfigValue = function(cname) {

	    if (cname in me.initialConfig) {
		return me.initialConfig[cname];
	    }
	    if (cname in me.cbindData) {
		return me.cbindData[cname];
	    }
	    if (cname in me) {
		return me[cname];
	    }
	    throw "unable to get cbind data for '" + cname + "'";
	};

	var applyCBind = function(obj) {
	    var cbind = obj.cbind, prop, cdata, cvalue, match, found;
	    if (!cbind) return;

	    for (prop in cbind) {
		cdata = cbind[prop];

		found = false;
		if (match = /^\{(!)?([a-z_][a-z0-9_]*)\}$/i.exec(cdata)) {
		    var cvalue = getConfigValue(match[2]);
		    if (match[1]) cvalue = !cvalue;
		    obj[prop] = cvalue;
		    found = true;
		} else if (match = /^\{(!)?([a-z_][a-z0-9_]*(\.[a-z_][a-z0-9_]*)+)\}$/i.exec(cdata)) {
		    var keys = match[2].split('.');
		    var cvalue = getConfigValue(keys.shift());
		    keys.forEach(function(k) {
			if (k in cvalue) {
			    cvalue = cvalue[k];
			} else {
			    throw "unable to get cbind data for '" + match[2] + "'";
			}
		    });
		    if (match[1]) cvalue = !cvalue;
		    obj[prop] = cvalue;
		    found = true;
		} else {
		    obj[prop] = cdata.replace(/{([a-z_][a-z0-9_]*)\}/ig, function(match, cname) {
			var cvalue = getConfigValue(cname);
			found = true;
			return cvalue;
		    });
		}
		if (!found) {
		    throw "unable to parse cbind template '" + cdata + "'";
		}

	    }
	};

	if (me.cbind) {
	    applyCBind(me);
	}

	var cloneTemplateArray = function(org) {
	    var copy, i, found, el, elcopy, arrayLength;

	    arrayLength = org.length;
	    found = false;
	    for (i = 0; i < arrayLength; i++) {
		el = org[i];
		if (el.constructor == Object && el.xtype) {
		    found = true;
		    break;
		}
	    }

	    if (!found) return org; // no need to copy

	    copy = [];
	    for (i = 0; i < arrayLength; i++) {
		el = org[i];
		if (el.constructor == Object && el.xtype) {
		    elcopy = cloneTemplateObject(el);
		    if (elcopy.cbind) {
			applyCBind(elcopy);
		    }
		    copy.push(elcopy);
		} else if (el.constructor == Array) {
		    elcopy = cloneTemplateArray(el);
		    copy.push(elcopy);
		} else {
		    copy.push(el);
		}
	    }
	    return copy;
	};

	var cloneTemplateObject = function(org) {
	    var res = {}, prop, el, copy;
	    for (prop in org) {
		el = org[prop];
		if (el.constructor == Object && el.xtype) {
		    copy = cloneTemplateObject(el);
		    if (copy.cbind) {
			applyCBind(copy);
		    }
		    res[prop] = copy;
		} else if (el.constructor == Array) {
		    copy = cloneTemplateArray(el);
		    res[prop] = copy;
		} else {
		    res[prop] = el;
		}
	    }
	    return res;
	};

	var condCloneProperties = function() {
	    var prop, el, i, tmp;

	    for (prop in me) {
		el = me[prop];
		if (el === undefined || el === null) continue;
		if (typeof(el) === 'object' && el.constructor == Object) {
		    if (el.xtype && prop != 'config') {
			me[prop] = cloneTemplateObject(el);
		    }
		} else if (el.constructor == Array) {
		    tmp = cloneTemplateArray(el);
		    me[prop] = tmp;
		}
	    }
	};

	condCloneProperties();
    }
});
/* A reader to store a single JSON Object (hash) into a storage.
 * Also accepts an array containing a single hash.
 *
 * So it can read:
 *
 * example1: {data1: "xyz", data2: "abc"}
 * returns [{key: "data1", value: "xyz"}, {key: "data2", value: "abc"}]
 *
 * example2: [ {data1: "xyz", data2: "abc"} ]
 * returns [{key: "data1", value: "xyz"}, {key: "data2", value: "abc"}]
 *
 * If you set 'readArray', the reader expexts the object as array:
 *
 * example3: [ { key: "data1", value: "xyz", p2: "cde" },  { key: "data2", value: "abc", p2: "efg" }]
 * returns [{key: "data1", value: "xyz", p2: "cde}, {key: "data2", value: "abc", p2: "efg"}]
 *
 * Note: The records can contain additional properties (like 'p2' above) when you use 'readArray'
 *
 * Additional feature: specify allowed properties with default values with 'rows' object
 *
 * var rows = {
 *   memory: {
 *     required: true,
 *     defaultValue: 512
 *   }
 * }
 *
 */

Ext.define('Proxmox.data.reader.JsonObject', {
    extend: 'Ext.data.reader.Json',
    alias : 'reader.jsonobject',

    readArray: false,

    rows: undefined,

    constructor: function(config) {
        var me = this;

        Ext.apply(me, config || {});

	me.callParent([config]);
    },

    getResponseData: function(response) {
	var me = this;

	var data = [];
        try {
        var result = Ext.decode(response.responseText);
        // get our data items inside the server response
        var root = result[me.getRootProperty()];

	    if (me.readArray) {

		var rec_hash = {};
		Ext.Array.each(root, function(rec) {
		    if (Ext.isDefined(rec.key)) {
			rec_hash[rec.key] = rec;
		    }
		});

		if (me.rows) {
		    Ext.Object.each(me.rows, function(key, rowdef) {
			var rec = rec_hash[key];
			if (Ext.isDefined(rec)) {
			    if (!Ext.isDefined(rec.value)) {
				rec.value = rowdef.defaultValue;
			    }
			    data.push(rec);
			} else if (Ext.isDefined(rowdef.defaultValue)) {
			    data.push({key: key, value: rowdef.defaultValue} );
			} else if (rowdef.required) {
			    data.push({key: key, value: undefined });
			}
		    });
		} else {
		    Ext.Array.each(root, function(rec) {
			if (Ext.isDefined(rec.key)) {
			    data.push(rec);
			}
		    });
		}

	    } else {

		var org_root = root;

		if (Ext.isArray(org_root)) {
		    if (root.length == 1) {
			root = org_root[0];
		    } else {
			root = {};
		    }
		}

		if (me.rows) {
		    Ext.Object.each(me.rows, function(key, rowdef) {
			if (Ext.isDefined(root[key])) {
			    data.push({key: key, value: root[key]});
			} else if (Ext.isDefined(rowdef.defaultValue)) {
			    data.push({key: key, value: rowdef.defaultValue});
			} else if (rowdef.required) {
			    data.push({key: key, value: undefined});
			}
		    });
		} else {
		    Ext.Object.each(root, function(key, value) {
			data.push({key: key, value: value });
		    });
		}
	    }
	}
        catch (ex) {
            Ext.Error.raise({
                response: response,
                json: response.responseText,
                parseError: ex,
                msg: 'Unable to parse the JSON returned by the server: ' + ex.toString()
            });
        }

	return data;
    }
});

Ext.define('Proxmox.RestProxy', {
    extend: 'Ext.data.RestProxy',
    alias : 'proxy.proxmox',

    pageParam : null,
    startParam: null,
    limitParam: null,
    groupParam: null,
    sortParam: null,
    filterParam: null,
    noCache : false,

    afterRequest: function(request, success) {
	this.fireEvent('afterload', this, request, success);
	return;
    },

    constructor: function(config) {

	Ext.applyIf(config, {
	    reader: {
		type: 'json',
		rootProperty: config.root || 'data'
	    }
	});

	this.callParent([config]);
    }
}, function() {

    Ext.define('KeyValue', {
	extend: "Ext.data.Model",
	fields: [ 'key', 'value' ],
	idProperty: 'key'
    });

    Ext.define('KeyValuePendingDelete', {
	extend: "Ext.data.Model",
	fields: [ 'key', 'value', 'pending', 'delete' ],
	idProperty: 'key'
    });

    Ext.define('proxmox-tasks', {
	extend: 'Ext.data.Model',
	fields:  [
	    { name: 'starttime', type : 'date', dateFormat: 'timestamp' },
	    { name: 'endtime', type : 'date', dateFormat: 'timestamp' },
	    { name: 'pid', type: 'int' },
	    'node', 'upid', 'user', 'status', 'type', 'id'
	],
	idProperty: 'upid'
    });

    Ext.define('proxmox-cluster-log', {
	extend: 'Ext.data.Model',
	fields:  [
	    { name: 'uid' , type: 'int' },
	    { name: 'time', type : 'date', dateFormat: 'timestamp' },
	    { name: 'pri', type: 'int' },
	    { name: 'pid', type: 'int' },
	    'node', 'user', 'tag', 'msg',
	    {
		name: 'id',
		convert: function(value, record) {
		    var info = record.data;
		    var text;

		    if (value) {
			return value;
		    }
		    // compute unique ID
		    return info.uid + ':' + info.node;
		}
	    }
	],
	idProperty: 'id'
    });

});
/* Extends the Ext.data.Store type
 * with  startUpdate() and stopUpdate() methods
 * to refresh the store data in the background
 * Components using this store directly will flicker
 * due to the redisplay of the element ater 'config.interval' ms
 *
 * Note that you have to call yourself startUpdate() for the background load
 * to begin
 */
Ext.define('Proxmox.data.UpdateStore', {
    extend: 'Ext.data.Store',
    alias: 'store.update',

    isStopped: true,

    autoStart: false,

    destroy: function() {
	var me = this;
	me.stopUpdate();
	me.callParent();
    },

    constructor: function(config) {
	var me = this;

	config = config || {};

	if (!config.interval) {
	    config.interval = 3000;
	}

	if (!config.storeid) {
	    throw "no storeid specified";
	}

	var load_task = new Ext.util.DelayedTask();

	var run_load_task = function() {
	    if (me.isStopped) {
		return;
	    }

	    if (Proxmox.Utils.authOK()) {
		var start = new Date();
		me.load(function() {
		    var runtime = (new Date()) - start;
		    var interval = config.interval + runtime*2;
		    load_task.delay(interval, run_load_task);
		});
	    } else {
		load_task.delay(200, run_load_task);
	    }
	};

	Ext.apply(config, {
	    startUpdate: function() {
		me.isStopped = false;
		// run_load_task(); this makes problems with chrome
		load_task.delay(1, run_load_task);
	    },
	    stopUpdate: function() {
		me.isStopped = true;
		load_task.cancel();
	    }
	});

	me.callParent([config]);

	me.load_task = load_task;

	if (me.autoStart) {
	    me.startUpdate();
	}
    }
});
/*
 * The DiffStore is a in-memory store acting as proxy between a real store
 * instance and a component.
 * Its purpose is to redisplay the component *only* if the data has been changed
 * inside the real store, to avoid the annoying visual flickering of using
 * the real store directly.
 *
 * Implementation:
 * The DiffStore monitors via mon() the 'load' events sent by the real store.
 * On each 'load' event, the DiffStore compares its own content with the target
 * store (call to cond_add_item()) and then fires a 'refresh' event.
 * The 'refresh' event will automatically trigger a view refresh on the component
 * who binds to this store.
 */

/* Config properties:
 * rstore: the realstore which will autorefresh its content from the API
 * Only works if rstore has a model and use 'idProperty'
 * sortAfterUpdate: sort the diffstore before rendering the view
 */
Ext.define('Proxmox.data.DiffStore', {
    extend: 'Ext.data.Store',
    alias: 'store.diff',

    sortAfterUpdate: false,

    constructor: function(config) {
	var me = this;

	config = config || {};

	if (!config.rstore) {
	    throw "no rstore specified";
	}

	if (!config.rstore.model) {
	    throw "no rstore model specified";
	}

	var rstore = config.rstore;

	Ext.apply(config, {
	    model: rstore.model,
	    proxy: { type: 'memory' }
	});

	me.callParent([config]);

	var first_load = true;

	var cond_add_item = function(data, id) {
	    var olditem = me.getById(id);
	    if (olditem) {
		olditem.beginEdit();
		Ext.Array.each(me.model.prototype.fields, function(field) {
		    if (olditem.data[field.name] !== data[field.name]) {
			olditem.set(field.name, data[field.name]);
		    }
		});
		olditem.endEdit(true);
		olditem.commit();
	    } else {
		var newrec = Ext.create(me.model, data);
		var pos = (me.appendAtStart && !first_load) ? 0 : me.data.length;
		me.insert(pos, newrec);
	    }
	};

	var loadFn = function(s, records, success) {

	    if (!success) {
		return;
	    }

	    me.suspendEvents();

	    // getSource returns null if data is not filtered
	    // if it is filtered it returns all records
	    var allItems = me.getData().getSource() || me.getData();

	    // remove vanished items
	    allItems.each(function(olditem) {
		var item = rstore.getById(olditem.getId());
		if (!item) {
		    me.remove(olditem);
		}
	    });

	    rstore.each(function(item) {
		cond_add_item(item.data, item.getId());
	    });

	    me.filter();

	    if (me.sortAfterUpdate) {
		me.sort();
	    }

	    first_load = false;

	    me.resumeEvents();
	    me.fireEvent('refresh', me);
	    me.fireEvent('datachanged', me);
	};

	if (rstore.isLoaded()) {
	    // if store is already loaded,
	    // insert items instantly
	    loadFn(rstore, [], true);
	}

	me.mon(rstore, 'load', loadFn);
    }
});
/* This store encapsulates data items which are organized as an Array of key-values Objects
 * ie data[0] contains something like {key: "keyboard", value: "da"}
*
* Designed to work with the KeyValue model and the JsonObject data reader
*/
Ext.define('Proxmox.data.ObjectStore',  {
    extend: 'Proxmox.data.UpdateStore',

    getRecord: function() {
	var me = this;
	var record = Ext.create('Ext.data.Model');
	me.getData().each(function(item) {
	    record.set(item.data.key, item.data.value);
	});
	record.commit(true);
	return record;
    },

    constructor: function(config) {
	var me = this;

        config = config || {};

	if (!config.storeid) {
	    config.storeid =  'proxmox-store-' + (++Ext.idSeed);
	}

        Ext.applyIf(config, {
	    model: 'KeyValue',
            proxy: {
                type: 'proxmox',
		url: config.url,
		extraParams: config.extraParams,
                reader: {
		    type: 'jsonobject',
		    rows: config.rows,
		    readArray: config.readArray,
		    rootProperty: config.root || 'data'
		}
            }
        });

        me.callParent([config]);
    }
});
/* Extends the Proxmox.data.UpdateStore type
 *
 *
 */
Ext.define('Proxmox.data.RRDStore', {
    extend: 'Proxmox.data.UpdateStore',
    alias: 'store.proxmoxRRDStore',

    setRRDUrl: function(timeframe, cf) {
	var me = this;
	if (!timeframe) {
	    timeframe = me.timeframe;
	}

	if (!cf) {
	    cf = me.cf;
	}

	me.proxy.url = me.rrdurl + "?timeframe=" + timeframe + "&cf=" + cf;
    },

    proxy: {
	type: 'proxmox'
    },

    timeframe: 'hour',

    cf: 'AVERAGE',

    constructor: function(config) {
	var me = this;

	config = config || {};

	// set default interval to 30seconds
	if (!config.interval) {
	    config.interval = 30000;
	}

	// set a new storeid
	if (!config.storeid) {
	    config.storeid = 'rrdstore-' + (++Ext.idSeed);
	}

	// rrdurl is required
	if (!config.rrdurl) {
	    throw "no rrdurl specified";
	}

	var stateid = 'proxmoxRRDTypeSelection';
	var sp = Ext.state.Manager.getProvider();
	var stateinit = sp.get(stateid);

        if (stateinit) {
	    if(stateinit.timeframe !== me.timeframe || stateinit.cf !== me.rrdcffn){
		me.timeframe = stateinit.timeframe;
		me.rrdcffn = stateinit.cf;
	    }
	}

	me.callParent([config]);

	me.setRRDUrl();
	me.mon(sp, 'statechange', function(prov, key, state){
	    if (key === stateid) {
		if (state && state.id) {
		    if (state.timeframe !== me.timeframe || state.cf !== me.cf) {
		        me.timeframe = state.timeframe;
		        me.cf = state.cf;
			me.setRRDUrl();
			me.reload();
		    }
		}
	    }
	});
    }
});
Ext.define('Timezone', {
    extend: 'Ext.data.Model',
    fields: ['zone']
});

Ext.define('Proxmox.data.TimezoneStore', {
    extend: 'Ext.data.Store',
    model: 'Timezone',
    data: [
	    ['Africa/Abidjan'],
	    ['Africa/Accra'],
	    ['Africa/Addis_Ababa'],
	    ['Africa/Algiers'],
	    ['Africa/Asmara'],
	    ['Africa/Bamako'],
	    ['Africa/Bangui'],
	    ['Africa/Banjul'],
	    ['Africa/Bissau'],
	    ['Africa/Blantyre'],
	    ['Africa/Brazzaville'],
	    ['Africa/Bujumbura'],
	    ['Africa/Cairo'],
	    ['Africa/Casablanca'],
	    ['Africa/Ceuta'],
	    ['Africa/Conakry'],
	    ['Africa/Dakar'],
	    ['Africa/Dar_es_Salaam'],
	    ['Africa/Djibouti'],
	    ['Africa/Douala'],
	    ['Africa/El_Aaiun'],
	    ['Africa/Freetown'],
	    ['Africa/Gaborone'],
	    ['Africa/Harare'],
	    ['Africa/Johannesburg'],
	    ['Africa/Kampala'],
	    ['Africa/Khartoum'],
	    ['Africa/Kigali'],
	    ['Africa/Kinshasa'],
	    ['Africa/Lagos'],
	    ['Africa/Libreville'],
	    ['Africa/Lome'],
	    ['Africa/Luanda'],
	    ['Africa/Lubumbashi'],
	    ['Africa/Lusaka'],
	    ['Africa/Malabo'],
	    ['Africa/Maputo'],
	    ['Africa/Maseru'],
	    ['Africa/Mbabane'],
	    ['Africa/Mogadishu'],
	    ['Africa/Monrovia'],
	    ['Africa/Nairobi'],
	    ['Africa/Ndjamena'],
	    ['Africa/Niamey'],
	    ['Africa/Nouakchott'],
	    ['Africa/Ouagadougou'],
	    ['Africa/Porto-Novo'],
	    ['Africa/Sao_Tome'],
	    ['Africa/Tripoli'],
	    ['Africa/Tunis'],
	    ['Africa/Windhoek'],
	    ['America/Adak'],
	    ['America/Anchorage'],
	    ['America/Anguilla'],
	    ['America/Antigua'],
	    ['America/Araguaina'],
	    ['America/Argentina/Buenos_Aires'],
	    ['America/Argentina/Catamarca'],
	    ['America/Argentina/Cordoba'],
	    ['America/Argentina/Jujuy'],
	    ['America/Argentina/La_Rioja'],
	    ['America/Argentina/Mendoza'],
	    ['America/Argentina/Rio_Gallegos'],
	    ['America/Argentina/Salta'],
	    ['America/Argentina/San_Juan'],
	    ['America/Argentina/San_Luis'],
	    ['America/Argentina/Tucuman'],
	    ['America/Argentina/Ushuaia'],
	    ['America/Aruba'],
	    ['America/Asuncion'],
	    ['America/Atikokan'],
	    ['America/Bahia'],
	    ['America/Bahia_Banderas'],
	    ['America/Barbados'],
	    ['America/Belem'],
	    ['America/Belize'],
	    ['America/Blanc-Sablon'],
	    ['America/Boa_Vista'],
	    ['America/Bogota'],
	    ['America/Boise'],
	    ['America/Cambridge_Bay'],
	    ['America/Campo_Grande'],
	    ['America/Cancun'],
	    ['America/Caracas'],
	    ['America/Cayenne'],
	    ['America/Cayman'],
	    ['America/Chicago'],
	    ['America/Chihuahua'],
	    ['America/Costa_Rica'],
	    ['America/Cuiaba'],
	    ['America/Curacao'],
	    ['America/Danmarkshavn'],
	    ['America/Dawson'],
	    ['America/Dawson_Creek'],
	    ['America/Denver'],
	    ['America/Detroit'],
	    ['America/Dominica'],
	    ['America/Edmonton'],
	    ['America/Eirunepe'],
	    ['America/El_Salvador'],
	    ['America/Fortaleza'],
	    ['America/Glace_Bay'],
	    ['America/Godthab'],
	    ['America/Goose_Bay'],
	    ['America/Grand_Turk'],
	    ['America/Grenada'],
	    ['America/Guadeloupe'],
	    ['America/Guatemala'],
	    ['America/Guayaquil'],
	    ['America/Guyana'],
	    ['America/Halifax'],
	    ['America/Havana'],
	    ['America/Hermosillo'],
	    ['America/Indiana/Indianapolis'],
	    ['America/Indiana/Knox'],
	    ['America/Indiana/Marengo'],
	    ['America/Indiana/Petersburg'],
	    ['America/Indiana/Tell_City'],
	    ['America/Indiana/Vevay'],
	    ['America/Indiana/Vincennes'],
	    ['America/Indiana/Winamac'],
	    ['America/Inuvik'],
	    ['America/Iqaluit'],
	    ['America/Jamaica'],
	    ['America/Juneau'],
	    ['America/Kentucky/Louisville'],
	    ['America/Kentucky/Monticello'],
	    ['America/La_Paz'],
	    ['America/Lima'],
	    ['America/Los_Angeles'],
	    ['America/Maceio'],
	    ['America/Managua'],
	    ['America/Manaus'],
	    ['America/Marigot'],
	    ['America/Martinique'],
	    ['America/Matamoros'],
	    ['America/Mazatlan'],
	    ['America/Menominee'],
	    ['America/Merida'],
	    ['America/Mexico_City'],
	    ['America/Miquelon'],
	    ['America/Moncton'],
	    ['America/Monterrey'],
	    ['America/Montevideo'],
	    ['America/Montreal'],
	    ['America/Montserrat'],
	    ['America/Nassau'],
	    ['America/New_York'],
	    ['America/Nipigon'],
	    ['America/Nome'],
	    ['America/Noronha'],
	    ['America/North_Dakota/Center'],
	    ['America/North_Dakota/New_Salem'],
	    ['America/Ojinaga'],
	    ['America/Panama'],
	    ['America/Pangnirtung'],
	    ['America/Paramaribo'],
	    ['America/Phoenix'],
	    ['America/Port-au-Prince'],
	    ['America/Port_of_Spain'],
	    ['America/Porto_Velho'],
	    ['America/Puerto_Rico'],
	    ['America/Rainy_River'],
	    ['America/Rankin_Inlet'],
	    ['America/Recife'],
	    ['America/Regina'],
	    ['America/Resolute'],
	    ['America/Rio_Branco'],
	    ['America/Santa_Isabel'],
	    ['America/Santarem'],
	    ['America/Santiago'],
	    ['America/Santo_Domingo'],
	    ['America/Sao_Paulo'],
	    ['America/Scoresbysund'],
	    ['America/Shiprock'],
	    ['America/St_Barthelemy'],
	    ['America/St_Johns'],
	    ['America/St_Kitts'],
	    ['America/St_Lucia'],
	    ['America/St_Thomas'],
	    ['America/St_Vincent'],
	    ['America/Swift_Current'],
	    ['America/Tegucigalpa'],
	    ['America/Thule'],
	    ['America/Thunder_Bay'],
	    ['America/Tijuana'],
	    ['America/Toronto'],
	    ['America/Tortola'],
	    ['America/Vancouver'],
	    ['America/Whitehorse'],
	    ['America/Winnipeg'],
	    ['America/Yakutat'],
	    ['America/Yellowknife'],
	    ['Antarctica/Casey'],
	    ['Antarctica/Davis'],
	    ['Antarctica/DumontDUrville'],
	    ['Antarctica/Macquarie'],
	    ['Antarctica/Mawson'],
	    ['Antarctica/McMurdo'],
	    ['Antarctica/Palmer'],
	    ['Antarctica/Rothera'],
	    ['Antarctica/South_Pole'],
	    ['Antarctica/Syowa'],
	    ['Antarctica/Vostok'],
	    ['Arctic/Longyearbyen'],
	    ['Asia/Aden'],
	    ['Asia/Almaty'],
	    ['Asia/Amman'],
	    ['Asia/Anadyr'],
	    ['Asia/Aqtau'],
	    ['Asia/Aqtobe'],
	    ['Asia/Ashgabat'],
	    ['Asia/Baghdad'],
	    ['Asia/Bahrain'],
	    ['Asia/Baku'],
	    ['Asia/Bangkok'],
	    ['Asia/Beirut'],
	    ['Asia/Bishkek'],
	    ['Asia/Brunei'],
	    ['Asia/Choibalsan'],
	    ['Asia/Chongqing'],
	    ['Asia/Colombo'],
	    ['Asia/Damascus'],
	    ['Asia/Dhaka'],
	    ['Asia/Dili'],
	    ['Asia/Dubai'],
	    ['Asia/Dushanbe'],
	    ['Asia/Gaza'],
	    ['Asia/Harbin'],
	    ['Asia/Ho_Chi_Minh'],
	    ['Asia/Hong_Kong'],
	    ['Asia/Hovd'],
	    ['Asia/Irkutsk'],
	    ['Asia/Jakarta'],
	    ['Asia/Jayapura'],
	    ['Asia/Jerusalem'],
	    ['Asia/Kabul'],
	    ['Asia/Kamchatka'],
	    ['Asia/Karachi'],
	    ['Asia/Kashgar'],
	    ['Asia/Kathmandu'],
	    ['Asia/Kolkata'],
	    ['Asia/Krasnoyarsk'],
	    ['Asia/Kuala_Lumpur'],
	    ['Asia/Kuching'],
	    ['Asia/Kuwait'],
	    ['Asia/Macau'],
	    ['Asia/Magadan'],
	    ['Asia/Makassar'],
	    ['Asia/Manila'],
	    ['Asia/Muscat'],
	    ['Asia/Nicosia'],
	    ['Asia/Novokuznetsk'],
	    ['Asia/Novosibirsk'],
	    ['Asia/Omsk'],
	    ['Asia/Oral'],
	    ['Asia/Phnom_Penh'],
	    ['Asia/Pontianak'],
	    ['Asia/Pyongyang'],
	    ['Asia/Qatar'],
	    ['Asia/Qyzylorda'],
	    ['Asia/Rangoon'],
	    ['Asia/Riyadh'],
	    ['Asia/Sakhalin'],
	    ['Asia/Samarkand'],
	    ['Asia/Seoul'],
	    ['Asia/Shanghai'],
	    ['Asia/Singapore'],
	    ['Asia/Taipei'],
	    ['Asia/Tashkent'],
	    ['Asia/Tbilisi'],
	    ['Asia/Tehran'],
	    ['Asia/Thimphu'],
	    ['Asia/Tokyo'],
	    ['Asia/Ulaanbaatar'],
	    ['Asia/Urumqi'],
	    ['Asia/Vientiane'],
	    ['Asia/Vladivostok'],
	    ['Asia/Yakutsk'],
	    ['Asia/Yekaterinburg'],
	    ['Asia/Yerevan'],
	    ['Atlantic/Azores'],
	    ['Atlantic/Bermuda'],
	    ['Atlantic/Canary'],
	    ['Atlantic/Cape_Verde'],
	    ['Atlantic/Faroe'],
	    ['Atlantic/Madeira'],
	    ['Atlantic/Reykjavik'],
	    ['Atlantic/South_Georgia'],
	    ['Atlantic/St_Helena'],
	    ['Atlantic/Stanley'],
	    ['Australia/Adelaide'],
	    ['Australia/Brisbane'],
	    ['Australia/Broken_Hill'],
	    ['Australia/Currie'],
	    ['Australia/Darwin'],
	    ['Australia/Eucla'],
	    ['Australia/Hobart'],
	    ['Australia/Lindeman'],
	    ['Australia/Lord_Howe'],
	    ['Australia/Melbourne'],
	    ['Australia/Perth'],
	    ['Australia/Sydney'],
	    ['Europe/Amsterdam'],
	    ['Europe/Andorra'],
	    ['Europe/Athens'],
	    ['Europe/Belgrade'],
	    ['Europe/Berlin'],
	    ['Europe/Bratislava'],
	    ['Europe/Brussels'],
	    ['Europe/Bucharest'],
	    ['Europe/Budapest'],
	    ['Europe/Chisinau'],
	    ['Europe/Copenhagen'],
	    ['Europe/Dublin'],
	    ['Europe/Gibraltar'],
	    ['Europe/Guernsey'],
	    ['Europe/Helsinki'],
	    ['Europe/Isle_of_Man'],
	    ['Europe/Istanbul'],
	    ['Europe/Jersey'],
	    ['Europe/Kaliningrad'],
	    ['Europe/Kiev'],
	    ['Europe/Lisbon'],
	    ['Europe/Ljubljana'],
	    ['Europe/London'],
	    ['Europe/Luxembourg'],
	    ['Europe/Madrid'],
	    ['Europe/Malta'],
	    ['Europe/Mariehamn'],
	    ['Europe/Minsk'],
	    ['Europe/Monaco'],
	    ['Europe/Moscow'],
	    ['Europe/Oslo'],
	    ['Europe/Paris'],
	    ['Europe/Podgorica'],
	    ['Europe/Prague'],
	    ['Europe/Riga'],
	    ['Europe/Rome'],
	    ['Europe/Samara'],
	    ['Europe/San_Marino'],
	    ['Europe/Sarajevo'],
	    ['Europe/Simferopol'],
	    ['Europe/Skopje'],
	    ['Europe/Sofia'],
	    ['Europe/Stockholm'],
	    ['Europe/Tallinn'],
	    ['Europe/Tirane'],
	    ['Europe/Uzhgorod'],
	    ['Europe/Vaduz'],
	    ['Europe/Vatican'],
	    ['Europe/Vienna'],
	    ['Europe/Vilnius'],
	    ['Europe/Volgograd'],
	    ['Europe/Warsaw'],
	    ['Europe/Zagreb'],
	    ['Europe/Zaporozhye'],
	    ['Europe/Zurich'],
	    ['Indian/Antananarivo'],
	    ['Indian/Chagos'],
	    ['Indian/Christmas'],
	    ['Indian/Cocos'],
	    ['Indian/Comoro'],
	    ['Indian/Kerguelen'],
	    ['Indian/Mahe'],
	    ['Indian/Maldives'],
	    ['Indian/Mauritius'],
	    ['Indian/Mayotte'],
	    ['Indian/Reunion'],
	    ['Pacific/Apia'],
	    ['Pacific/Auckland'],
	    ['Pacific/Chatham'],
	    ['Pacific/Chuuk'],
	    ['Pacific/Easter'],
	    ['Pacific/Efate'],
	    ['Pacific/Enderbury'],
	    ['Pacific/Fakaofo'],
	    ['Pacific/Fiji'],
	    ['Pacific/Funafuti'],
	    ['Pacific/Galapagos'],
	    ['Pacific/Gambier'],
	    ['Pacific/Guadalcanal'],
	    ['Pacific/Guam'],
	    ['Pacific/Honolulu'],
	    ['Pacific/Johnston'],
	    ['Pacific/Kiritimati'],
	    ['Pacific/Kosrae'],
	    ['Pacific/Kwajalein'],
	    ['Pacific/Majuro'],
	    ['Pacific/Marquesas'],
	    ['Pacific/Midway'],
	    ['Pacific/Nauru'],
	    ['Pacific/Niue'],
	    ['Pacific/Norfolk'],
	    ['Pacific/Noumea'],
	    ['Pacific/Pago_Pago'],
	    ['Pacific/Palau'],
	    ['Pacific/Pitcairn'],
	    ['Pacific/Pohnpei'],
	    ['Pacific/Port_Moresby'],
	    ['Pacific/Rarotonga'],
	    ['Pacific/Saipan'],
	    ['Pacific/Tahiti'],
	    ['Pacific/Tarawa'],
	    ['Pacific/Tongatapu'],
	    ['Pacific/Wake'],
	    ['Pacific/Wallis'],
	    ['UTC']
	]
});
Ext.define('Proxmox.form.field.Integer',{
    extend: 'Ext.form.field.Number',
    alias: 'widget.proxmoxintegerfield',

    config: {
	deleteEmpty: false
    },

    allowDecimals: false,
    allowExponential: false,
    step: 1,

   getSubmitData: function() {
        var me = this,
            data = null,
            val;
        if (!me.disabled && me.submitValue && !me.isFileUpload()) {
            val = me.getSubmitValue();
            if (val !== undefined && val !== null && val !== '') {
                data = {};
                data[me.getName()] = val;
            } else if (me.getDeleteEmpty()) {
		data = {};
                data['delete'] = me.getName();
	    }
        }
        return data;
    }

});
Ext.define('Proxmox.form.field.Textfield', {
    extend: 'Ext.form.field.Text',
    alias: ['widget.proxmoxtextfield'],

    config: {
	skipEmptyText: true,

	deleteEmpty: false,
    },

    getSubmitData: function() {
        var me = this,
            data = null,
            val;
        if (!me.disabled && me.submitValue && !me.isFileUpload()) {
            val = me.getSubmitValue();
            if (val !== null) {
                data = {};
                data[me.getName()] = val;
            } else if (me.getDeleteEmpty()) {
		data = {};
                data['delete'] = me.getName();
	    }
        }
        return data;
    },

    getSubmitValue: function() {
	var me = this;

        var value = this.processRawValue(this.getRawValue());
	if (value !== '') {
	    return value;
	}

	return me.getSkipEmptyText() ? null: value;
    },

    setAllowBlank: function(allowBlank) {
	this.allowBlank = allowBlank;
	this.validate();
    }
});
Ext.define('Proxmox.DateTimeField', {
    extend: 'Ext.form.FieldContainer',
    xtype: 'promxoxDateTimeField',

    layout: 'hbox',

    referenceHolder: true,

    submitFormat: 'U',

    getValue: function() {
	var me = this;
	var d = me.lookupReference('dateentry').getValue();

	if (d === undefined || d === null) { return null; }

	var t = me.lookupReference('timeentry').getValue();

	if (t === undefined || t === null) { return null; }

	var offset = (t.getHours()*3600+t.getMinutes()*60)*1000;

	return new Date(d.getTime() + offset);
    },

    getSubmitValue: function() {
        var me = this;
        var format = me.submitFormat;
        var value = me.getValue();

        return value ? Ext.Date.format(value, format) : null;
    },

    items: [
	{
	    xtype: 'datefield',
	    editable: false,
	    reference: 'dateentry',
	    flex: 1,
	    format: 'Y-m-d'
	},
	{
	    xtype: 'timefield',
	    reference: 'timeentry',
	    format: 'H:i',
	    width: 80,
	    value: '00:00',
	    increment: 60
	}
    ],

    initComponent: function() {
	var me = this;

	me.callParent();

	var value = me.value || new Date();

	me.lookupReference('dateentry').setValue(value);
	me.lookupReference('timeentry').setValue(value);

	me.relayEvents(me.lookupReference('dateentry'), ['change']);
	me.relayEvents(me.lookupReference('timeentry'), ['change']);
    }
});
Ext.define('Proxmox.form.Checkbox', {
    extend: 'Ext.form.field.Checkbox',
    alias: ['widget.proxmoxcheckbox'],

    config: {
	defaultValue: undefined,
	deleteDefaultValue: false,
	deleteEmpty: false
    },

    inputValue: '1',

    getSubmitData: function() {
        var me = this,
            data = null,
            val;
        if (!me.disabled && me.submitValue) {
            val = me.getSubmitValue();
            if (val !== null) {
                data = {};
		if ((val == me.getDefaultValue()) && me.getDeleteDefaultValue()) {
		    data['delete'] = me.getName();
		} else {
                    data[me.getName()] = val;
		}
            } else if (me.getDeleteEmpty()) {
               data = {};
               data['delete'] = me.getName();
	    }
        }
        return data;
    },

    // also accept integer 1 as true
    setRawValue: function(value) {
	var me = this;

	if (value === 1) {
            me.callParent([true]);
	} else {
            me.callParent([value]);
	}
    }

});
/* Key-Value ComboBox
 *
 * config properties:
 * comboItems: an array of Key - Value pairs
 * deleteEmpty: if set to true (default), an empty value received from the
 * comboBox will reset the property to its default value
 */
Ext.define('Proxmox.form.KVComboBox', {
    extend: 'Ext.form.field.ComboBox',
    alias: 'widget.proxmoxKVComboBox',

    config: {
	deleteEmpty: true
    },

    comboItems: undefined,
    displayField: 'value',
    valueField: 'key',
    queryMode: 'local',

    // overide framework function to implement deleteEmpty behaviour
    getSubmitData: function() {
        var me = this,
            data = null,
            val;
        if (!me.disabled && me.submitValue) {
            val = me.getSubmitValue();
            if (val !== null && val !== '' && val !== '__default__') {
                data = {};
                data[me.getName()] = val;
            } else if (me.getDeleteEmpty()) {
                data = {};
                data['delete'] = me.getName();
            }
        }
        return data;
    },

    validator: function(val) {
	var me = this;

	if (me.editable || val === null || val === '') {
	    return true;
	}

	if (me.store.getCount() > 0) {
	    var values = me.multiSelect ? val.split(me.delimiter) : [val];
	    var items = me.store.getData().collect('value', 'data');
	    if (Ext.Array.every(values, function(value) {
		return Ext.Array.contains(items, value);
	    })) {
		return true;
	    }
	}

	// returns a boolean or string
	/*jslint confusion: true */
	return "value '" + val + "' not allowed!";
    },

    initComponent: function() {
	var me = this;

	me.store = Ext.create('Ext.data.ArrayStore', {
	    model: 'KeyValue',
	    data : me.comboItems
	});

	if (me.initialConfig.editable === undefined) {
	    me.editable = false;
	}

	me.callParent();
    },

    setComboItems: function(items) {
	var me = this;

	me.getStore().setData(items);
    }

});
Ext.define('Proxmox.form.LanguageSelector', {
    extend: 'Proxmox.form.KVComboBox',
    xtype: 'proxmoxLanguageSelector',

    comboItems: Proxmox.Utils.language_array()
});
/*
 * ComboGrid component: a ComboBox where the dropdown menu (the
 * "Picker") is a Grid with Rows and Columns expects a listConfig
 * object with a columns property roughly based on the GridPicker from
 * https://www.sencha.com/forum/showthread.php?299909
 *
*/

Ext.define('Proxmox.form.ComboGrid', {
    extend: 'Ext.form.field.ComboBox',
    alias: ['widget.proxmoxComboGrid'],

    // this value is used as default value after load()
    preferredValue: undefined,

    // hack: allow to select empty value
    // seems extjs does not allow that when 'editable == false'
    onKeyUp: function(e, t) {
        var me = this;
        var key = e.getKey();

        if (!me.editable && me.allowBlank && !me.multiSelect &&
	    (key == e.BACKSPACE || key == e.DELETE)) {
	    me.setValue('');
	}

        me.callParent(arguments);
    },

    config: {
	skipEmptyText: false,
	notFoundIsValid: false,
	deleteEmpty: false,
    },

    // needed to trigger onKeyUp etc.
    enableKeyEvents: true,

    editable: false,

    triggers: {
	clear: {
	    cls: 'pmx-clear-trigger',
	    weight: -1,
	    hidden: true,
	    handler: function() {
		var me = this;
		me.setValue('');
	    }
	}
    },

    setValue: function(value) {
	var me = this;
	let empty = Ext.isArray(value) ? !value.length : !value;
	me.triggers.clear.setVisible(!empty && me.allowBlank);
	return me.callParent([value]);
    },

    // override ExtJS method
    // if the field has multiSelect enabled, the store is not loaded, and
    // the displayfield == valuefield, it saves the rawvalue as an array
    // but the getRawValue method is only defined in the textfield class
    // (which has not to deal with arrays) an returns the string in the
    // field (not an array)
    //
    // so if we have multiselect enabled, return the rawValue (which
    // should be an array) and else we do callParent so
    // it should not impact any other use of the class
    getRawValue: function() {
	var me = this;
	if (me.multiSelect) {
	    return me.rawValue;
	} else {
	    return me.callParent();
	}
    },

    getSubmitData: function() {
	var me = this;

	let data = null;
	if (!me.disabled && me.submitValue) {
	    let val = me.getSubmitValue();
	    if (val !== null) {
		data = {};
		data[me.getName()] = val;
	    } else if (me.getDeleteEmpty()) {
		data = {};
		data['delete'] = me.getName();
	    }
	}
	return data;
   },

    getSubmitValue: function() {
	var me = this;

	var value = me.callParent();
	if (value !== '') {
	    return value;
	}

	return me.getSkipEmptyText() ? null: value;
    },

    setAllowBlank: function(allowBlank) {
	this.allowBlank = allowBlank;
	this.validate();
    },

// override ExtJS protected method
    onBindStore: function(store, initial) {
        var me = this,
            picker = me.picker,
            extraKeySpec,
            valueCollectionConfig;

        // We're being bound, not unbound...
        if (store) {
            // If store was created from a 2 dimensional array with generated field names 'field1' and 'field2'
            if (store.autoCreated) {
                me.queryMode = 'local';
                me.valueField = me.displayField = 'field1';
                if (!store.expanded) {
                    me.displayField = 'field2';
                }

                // displayTpl config will need regenerating with the autogenerated displayField name 'field1'
                me.setDisplayTpl(null);
            }
            if (!Ext.isDefined(me.valueField)) {
                me.valueField = me.displayField;
            }

            // Add a byValue index to the store so that we can efficiently look up records by the value field
            // when setValue passes string value(s).
            // The two indices (Ext.util.CollectionKeys) are configured unique: false, so that if duplicate keys
            // are found, they are all returned by the get call.
            // This is so that findByText and findByValue are able to return the *FIRST* matching value. By default,
            // if unique is true, CollectionKey keeps the *last* matching value.
            extraKeySpec = {
                byValue: {
                    rootProperty: 'data',
                    unique: false
                }
            };
            extraKeySpec.byValue.property = me.valueField;
            store.setExtraKeys(extraKeySpec);

            if (me.displayField === me.valueField) {
                store.byText = store.byValue;
            } else {
                extraKeySpec.byText = {
                    rootProperty: 'data',
                    unique: false
                };
                extraKeySpec.byText.property = me.displayField;
                store.setExtraKeys(extraKeySpec);
            }

            // We hold a collection of the values which have been selected, keyed by this field's valueField.
            // This collection also functions as the selected items collection for the BoundList's selection model
            valueCollectionConfig = {
                rootProperty: 'data',
                extraKeys: {
                    byInternalId: {
                        property: 'internalId'
                    },
                    byValue: {
                        property: me.valueField,
                        rootProperty: 'data'
                    }
                },
                // Whenever this collection is changed by anyone, whether by this field adding to it,
                // or the BoundList operating, we must refresh our value.
                listeners: {
                    beginupdate: me.onValueCollectionBeginUpdate,
                    endupdate: me.onValueCollectionEndUpdate,
                    scope: me
                }
            };

            // This becomes our collection of selected records for the Field.
            me.valueCollection = new Ext.util.Collection(valueCollectionConfig);

            // We use the selected Collection as our value collection and the basis
            // for rendering the tag list.

            //proxmox override: since the picker is represented by a grid panel,
            // we changed here the selection to RowModel
            me.pickerSelectionModel = new Ext.selection.RowModel({
                mode: me.multiSelect ? 'SIMPLE' : 'SINGLE',
                // There are situations when a row is selected on mousedown but then the mouse is dragged to another row
                // and released.  In these situations, the event target for the click event won't be the row where the mouse
                // was released but the boundview.  The view will then determine that it should fire a container click, and
                // the DataViewModel will then deselect all prior selections. Setting `deselectOnContainerClick` here will
                // prevent the model from deselecting.
                deselectOnContainerClick: false,
                enableInitialSelection: false,
                pruneRemoved: false,
                selected: me.valueCollection,
                store: store,
                listeners: {
                    scope: me,
                    lastselectedchanged: me.updateBindSelection
                }
            });

            if (!initial) {
                me.resetToDefault();
            }

            if (picker) {
                picker.setSelectionModel(me.pickerSelectionModel);
                if (picker.getStore() !== store) {
                    picker.bindStore(store);
                }
            }
        }
    },

    // copied from ComboBox
    createPicker: function() {
        var me = this;
        var picker;

        var pickerCfg = Ext.apply({
                // proxmox overrides: display a grid for selection
                xtype: 'gridpanel',
                id: me.pickerId,
                pickerField: me,
                floating: true,
                hidden: true,
                store: me.store,
                displayField: me.displayField,
                preserveScrollOnRefresh: true,
                pageSize: me.pageSize,
                tpl: me.tpl,
                selModel: me.pickerSelectionModel,
                focusOnToFront: false
            }, me.listConfig, me.defaultListConfig);

        picker = me.picker || Ext.widget(pickerCfg);

        if (picker.getStore() !== me.store) {
            picker.bindStore(me.store);
        }

        if (me.pageSize) {
            picker.pagingToolbar.on('beforechange', me.onPageChange, me);
        }

        // proxmox overrides: pass missing method in gridPanel to its view
        picker.refresh = function() {
            picker.getSelectionModel().select(me.valueCollection.getRange());
            picker.getView().refresh();
        };
        picker.getNodeByRecord = function() {
            picker.getView().getNodeByRecord(arguments);
        };

        // We limit the height of the picker to fit in the space above
        // or below this field unless the picker has its own ideas about that.
        if (!picker.initialConfig.maxHeight) {
            picker.on({
                beforeshow: me.onBeforePickerShow,
                scope: me
            });
        }
        picker.getSelectionModel().on({
            beforeselect: me.onBeforeSelect,
            beforedeselect: me.onBeforeDeselect,
            focuschange: me.onFocusChange,
            selectionChange: function (sm, selectedRecords) {
                var me = this;
                if (selectedRecords.length) {
                    me.setValue(selectedRecords);
                    me.fireEvent('select', me, selectedRecords);
                }
            },
            scope: me
        });

	// hack for extjs6
	// when the clicked item is the same as the previously selected,
	// it does not select the item
	// instead we hide the picker
	if (!me.multiSelect) {
	    picker.on('itemclick', function (sm,record) {
		if (picker.getSelection()[0] === record) {
		    picker.hide();
		}
	    });
	}

	// when our store is not yet loaded, we increase
	// the height of the gridpanel, so that we can see
	// the loading mask
	//
	// we save the minheight to reset it after the load
	picker.on('show', function() {
	    if (me.enableLoadMask) {
		me.savedMinHeight = picker.getMinHeight();
		picker.setMinHeight(100);
	    }
	});

        picker.getNavigationModel().navigateOnSpace = false;

        return picker;
    },

    clearLocalFilter: function() {
        var me = this,
            filter = me.queryFilter;

        if (filter) {
            me.queryFilter = null;
            me.changingFilters = true;
            me.store.removeFilter(filter, true);
            me.changingFilters = false;
        }
    },

    isValueInStore: function(value) {
	var me = this;
	var store = me.store;
	var found = false;

	if (!store) {
	    return found;
	}

	// Make sure the current filter is removed before checking the store
	// to prevent false negative results when iterating over a filtered store.
	// All store.find*() method's operate on the filtered store.
	if (me.queryFilter && me.queryMode === 'local' && me.clearFilterOnBlur) {
	    me.clearLocalFilter();
	}

	if (Ext.isArray(value)) {
	    Ext.Array.each(value, function(v) {
		if (store.findRecord(me.valueField, v)) {
		    found = true;
		    return false; // break
		}
	    });
	} else {
	    found = !!store.findRecord(me.valueField, value);
	}

	return found;
    },

    validator: function (value) {
	var me = this;

	if (!value) {
	    return true; // handled later by allowEmpty in the getErrors call chain
	}

	// we normally get here the displayField as value, but if a valueField
	// is configured we need to get the "actual" value, to ensure it is in
	// the store. Below check is copied from ExtJS 6.0.2 ComboBox source
	//
	// we also have to get the 'real' value if the we have a mulitSelect
	// Field but got a non array value
	if ((me.valueField && me.valueField !== me.displayField) ||
	    (me.multiSelect && !Ext.isArray(value))) {
	    value = me.getValue();
	}

	if (!(me.notFoundIsValid || me.isValueInStore(value))) {
	    return gettext('Invalid Value');
	}

	return true;
    },

    initComponent: function() {
	var me = this;

	Ext.apply(me, {
	    queryMode: 'local',
	    matchFieldWidth: false
	});

	Ext.applyIf(me, { value: ''}); // hack: avoid ExtJS validate() bug

	Ext.applyIf(me.listConfig, { width: 400 });

        me.callParent();

        // Create the picker at an early stage, so it is available to store the previous selection
        if (!me.picker) {
            me.createPicker();
        }

	if (me.editable) {
	    // The trigger.picker causes first a focus event on the field then
	    // toggles the selection picker. Thus skip expanding in this case,
	    // else our focus listner expands and the picker.trigger then
	    // collapses it directly afterwards.
	    Ext.override(me.triggers.picker, {
		onMouseDown : function (e) {
		    // copied "should we focus" check from Ext.form.trigger.Trigger
		    if (e.pointerType !== 'touch' && !this.field.owns(Ext.Element.getActiveElement())) {
			me.skip_expand_on_focus = true;
		    }
		    this.callParent(arguments);
		}
	    });

	    me.on("focus", function(me) {
		if (!me.isExpanded && !me.skip_expand_on_focus) {
		    me.expand();
		}
		me.skip_expand_on_focus = false;
	    });
	}

	me.mon(me.store, 'beforeload', function() {
	    if (!me.isDisabled()) {
		me.enableLoadMask = true;
	    }
	});

	// hack: autoSelect does not work
	me.mon(me.store, 'load', function(store, r, success, o) {
	    if (success) {
		me.clearInvalid();

		if (me.enableLoadMask) {
		    delete me.enableLoadMask;

		    // if the picker exists,
		    // we reset its minheight to the saved var/0
		    // we have to update the layout, otherwise the height
		    // gets not recalculated
		    if (me.picker) {
			me.picker.setMinHeight(me.savedMinHeight || 0);
			delete me.savedMinHeight;
			me.picker.updateLayout();
		    }
		}

		var def = me.getValue() || me.preferredValue;
		if (def) {
		    me.setValue(def, true); // sync with grid
		}
		var found = false;
		if (def) {
		    found = me.isValueInStore(def);
		}

		if (!found) {
		    var rec = me.store.first();
		    if (me.autoSelect && rec && rec.data) {
			def = rec.data[me.valueField];
			me.setValue(def, true);
		    } else if (!me.allowBlank && ((Ext.isArray(def) && def.length) || def)) {
			me.setValue(def);
			if (!me.notFoundIsValid) {
			    me.markInvalid(gettext('Invalid Value'));
			}
		    }
		}
	    }
	});
    }
});
Ext.define('Proxmox.form.RRDTypeSelector', {
    extend: 'Ext.form.field.ComboBox',
    alias: ['widget.proxmoxRRDTypeSelector'],

    displayField: 'text',
    valueField: 'id',
    editable: false,
    queryMode: 'local',
    value: 'hour',
    stateEvents: [ 'select' ],
    stateful: true,
    stateId: 'proxmoxRRDTypeSelection',
    store: {
	type: 'array',
	fields: [ 'id', 'timeframe', 'cf', 'text' ],
	data : [
	    [ 'hour', 'hour', 'AVERAGE',
	      gettext('Hour') + ' (' + gettext('average') +')' ],
	    [ 'hourmax', 'hour', 'MAX',
	      gettext('Hour') + ' (' + gettext('maximum') + ')' ],
	    [ 'day', 'day', 'AVERAGE',
	      gettext('Day') + ' (' + gettext('average') + ')' ],
	    [ 'daymax', 'day', 'MAX',
	      gettext('Day') + ' (' + gettext('maximum') + ')' ],
	    [ 'week', 'week', 'AVERAGE',
	      gettext('Week') + ' (' + gettext('average') + ')' ],
	    [ 'weekmax', 'week', 'MAX',
	      gettext('Week') + ' (' + gettext('maximum') + ')' ],
	    [ 'month', 'month', 'AVERAGE',
	      gettext('Month') + ' (' + gettext('average') + ')' ],
	    [ 'monthmax', 'month', 'MAX',
	      gettext('Month') + ' (' + gettext('maximum') + ')' ],
	    [ 'year', 'year', 'AVERAGE',
	      gettext('Year') + ' (' + gettext('average') + ')' ],
	    [ 'yearmax', 'year', 'MAX',
	      gettext('Year') + ' (' + gettext('maximum') + ')' ]
	]
    },
    // save current selection in the state Provider so RRDView can read it
    getState: function() {
	var ind = this.getStore().findExact('id', this.getValue());
	var rec = this.getStore().getAt(ind);
	if (!rec) {
	    return;
	}
	return {
	    id: rec.data.id,
	    timeframe: rec.data.timeframe,
	    cf: rec.data.cf
	};
    },
    // set selection based on last saved state
    applyState : function(state) {
	if (state && state.id) {
	    this.setValue(state.id);
	}
    }
});
Ext.define('Proxmox.form.BondModeSelector', {
    extend: 'Proxmox.form.KVComboBox',
    alias: ['widget.bondModeSelector'],

    openvswitch: false,

    initComponent: function() {
	var me = this;

	if (me.openvswitch) {
	    me.comboItems = Proxmox.Utils.bond_mode_array([
	       'active-backup',
	       'balance-slb',
	       'lacp-balance-slb',
	       'lacp-balance-tcp',
	    ]);
	} else {
	    me.comboItems = Proxmox.Utils.bond_mode_array([
		'balance-rr',
		'active-backup',
		'balance-xor',
		'broadcast',
		'802.3ad',
		'balance-tlb',
		'balance-alb',
	    ]);
	}

	me.callParent();
    }
});

Ext.define('Proxmox.form.BondPolicySelector', {
    extend: 'Proxmox.form.KVComboBox',
    alias: ['widget.bondPolicySelector'],
    comboItems: [
	    ['layer2', 'layer2'],
	    ['layer2+3', 'layer2+3'],
	    ['layer3+4', 'layer3+4']
    ]
});

Ext.define('Proxmox.form.NetworkSelectorController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.proxmoxNetworkSelectorController',

    init: function(view) {
	var me = this;

	if (!view.nodename) {
	    throw "missing custom view config: nodename";
	}
	view.getStore().getProxy().setUrl('/api2/json/nodes/'+ view.nodename + '/network');
    }
});

Ext.define('Proxmox.data.NetworkSelector', {
    extend: 'Ext.data.Model',
    fields: [
	{name: 'active'},
	{name: 'cidr'},
	{name: 'cidr6'},
	{name: 'address'},
	{name: 'address6'},
	{name: 'comments'},
	{name: 'iface'},
	{name: 'slaves'},
	{name: 'type'}
    ]
});

Ext.define('Proxmox.form.NetworkSelector', {
    extend: 'Proxmox.form.ComboGrid',
    alias: 'widget.proxmoxNetworkSelector',

    controller: 'proxmoxNetworkSelectorController',

    nodename: 'localhost',
    setNodename: function(nodename) {
	this.nodename = nodename;
	var networkSelectorStore = this.getStore();
	networkSelectorStore.removeAll();
	// because of manual local copy of data for ip4/6
	this.getPicker().refresh();
	if (networkSelectorStore && typeof networkSelectorStore.getProxy === 'function') {
	    networkSelectorStore.getProxy().setUrl('/api2/json/nodes/'+ nodename + '/network');
	    networkSelectorStore.load();
	}
    },
    // set default value to empty array, else it inits it with
    // null and after the store load it is an empty array,
    // triggering dirtychange
    value: [],
    valueField: 'cidr',
    displayField: 'cidr',
    store: {
	autoLoad: true,
	model: 'Proxmox.data.NetworkSelector',
	proxy: {
	    type: 'proxmox'
	},
	sorters: [
	    {
		property : 'iface',
		direction: 'ASC'
	    }
	],
	filters: [
	    function(item) {
		return item.data.cidr;
	    }
	],
	listeners: {
	    load: function(store, records, successfull) {

		if (successfull) {
		    records.forEach(function(record) {
			if (record.data.cidr6) {
			    let dest = (record.data.cidr) ? record.copy(null) : record;
			    dest.data.cidr = record.data.cidr6;
			    dest.data.address = record.data.address6;
			    delete record.data.cidr6;
			    dest.data.comments = record.data.comments6;
			    delete record.data.comments6;
			    store.add(dest);
			}
		    });
		}
	    }
	}
    },
    listConfig: {
	width: 600,
	columns: [
	    {

		header: gettext('CIDR'),
		dataIndex: 'cidr',
		hideable: false,
		flex: 1
	    },
	    {

		header: gettext('IP'),
		dataIndex: 'address',
		hidden: true,
	    },
	    {
		header: gettext('Interface'),
		width: 90,
		dataIndex: 'iface'
	    },
	    {
		header: gettext('Active'),
		renderer: Proxmox.Utils.format_boolean,
		width: 60,
		dataIndex: 'active'
	    },
	    {
		header: gettext('Type'),
		width: 80,
		hidden: true,
		dataIndex: 'type'
	    },
	    {
		header: gettext('Comment'),
		flex: 2,
		dataIndex: 'comments'
	    }
	]
    }
});
/* Button features:
 * - observe selection changes to enable/disable the button using enableFn()
 * - pop up confirmation dialog using confirmMsg()
 */
Ext.define('Proxmox.button.Button', {
    extend: 'Ext.button.Button',
    alias: 'widget.proxmoxButton',

    // the selection model to observe
    selModel: undefined,

    // if 'false' handler will not be called (button disabled)
    enableFn: function(record) { },

    // function(record) or text
    confirmMsg: false,

    // take special care in confirm box (select no as default).
    dangerous: false,

    initComponent: function() {
	/*jslint confusion: true */

        var me = this;

	if (me.handler) {

	    // Note: me.realHandler may be a string (see named scopes)
	    var realHandler = me.handler;

	    me.handler = function(button, event) {
		var rec, msg;
		if (me.selModel) {
		    rec = me.selModel.getSelection()[0];
		    if (!rec || (me.enableFn(rec) === false)) {
			return;
		    }
		}

		if (me.confirmMsg) {
		    msg = me.confirmMsg;
		    if (Ext.isFunction(me.confirmMsg)) {
			msg = me.confirmMsg(rec);
		    }
		    Ext.MessageBox.defaultButton = me.dangerous ? 2 : 1;
		    Ext.Msg.show({
			title: gettext('Confirm'),
			icon: me.dangerous ? Ext.Msg.WARNING : Ext.Msg.QUESTION,
			message: msg,
			buttons: Ext.Msg.YESNO,
			defaultFocus: me.dangerous ? 'no' : 'yes',
			callback: function(btn) {
			    if (btn !== 'yes') {
				return;
			    }
			    Ext.callback(realHandler, me.scope, [button, event, rec], 0, me);
			}
		    });
		} else {
		    Ext.callback(realHandler, me.scope, [button, event, rec], 0, me);
		}
	    };
	}

	me.callParent();

	var grid;
	if (!me.selModel && me.selModel !== null) {
	    grid = me.up('grid');
	    if (grid && grid.selModel) {
		me.selModel = grid.selModel;
	    }
	}

	if (me.waitMsgTarget === true) {
	    grid = me.up('grid');
	    if (grid) {
		me.waitMsgTarget = grid;
	    } else {
		throw "unable to find waitMsgTarget";
	    }
	}

	if (me.selModel) {

	    me.mon(me.selModel, "selectionchange", function() {
		var rec = me.selModel.getSelection()[0];
		if (!rec || (me.enableFn(rec) === false)) {
		    me.setDisabled(true);
		} else  {
		    me.setDisabled(false);
		}
	    });
	}
    }
});


Ext.define('Proxmox.button.StdRemoveButton', {
    extend: 'Proxmox.button.Button',
    alias: 'widget.proxmoxStdRemoveButton',

    text: gettext('Remove'),

    disabled: true,

    // time to wait for removal task to finish
    delay: undefined,

    config: {
	baseurl: undefined
    },

    getUrl: function(rec) {
	var me = this;

	return me.baseurl + '/' + rec.getId();
    },

    // also works with names scopes
    callback: function(options, success, response) {},

    getRecordName: function(rec) { return rec.getId() },

    confirmMsg: function (rec) {
	var me = this;

	var name = me.getRecordName(rec);
	return Ext.String.format(
	    gettext('Are you sure you want to remove entry {0}'),
	    "'" + name + "'");
    },

    handler: function(btn, event, rec) {
	var me = this;

	var url = me.getUrl(rec);

	if (typeof me.delay !== 'undefined' && me .delay >= 0) {
	    url += "?delay=" + me.delay;
	}

	Proxmox.Utils.API2Request({
	    url: url,
	    method: 'DELETE',
	    waitMsgTarget: me.waitMsgTarget,
	    callback: function(options, success, response) {
		Ext.callback(me.callback, me.scope, [options, success, response], 0, me);
	    },
	    failure: function (response, opts) {
		Ext.Msg.alert(gettext('Error'), response.htmlStatus);
	    }
	});
    }
});
/* help button pointing to an online documentation
   for components contained in a modal window
*/
/*global
  proxmoxOnlineHelpInfo
*/
Ext.define('Proxmox.button.Help', {
    extend: 'Ext.button.Button',
    xtype: 'proxmoxHelpButton',

    text: gettext('Help'),

    // make help button less flashy by styling it like toolbar buttons
    iconCls: ' x-btn-icon-el-default-toolbar-small fa fa-question-circle',
    cls: 'x-btn-default-toolbar-small proxmox-inline-button',

    hidden: true,

    listenToGlobalEvent: true,

    controller: {
	xclass: 'Ext.app.ViewController',
	listen: {
	    global: {
		proxmoxShowHelp: 'onProxmoxShowHelp',
		proxmoxHideHelp: 'onProxmoxHideHelp'
	    }
	},
	onProxmoxShowHelp: function(helpLink) {
	    var me = this.getView();
	    if (me.listenToGlobalEvent === true) {
		me.setOnlineHelp(helpLink);
		me.show();
	    }
	},
	onProxmoxHideHelp: function() {
	    var me = this.getView();
	    if (me.listenToGlobalEvent === true) {
		me.hide();
	    }
	}
    },

    // this sets the link and the tooltip text
    setOnlineHelp:function(blockid) {
	var me = this;

	var info = Proxmox.Utils.get_help_info(blockid);
	if (info) {
	    me.onlineHelp = blockid;
	    var title = info.title;
	    if (info.subtitle) {
		title += ' - ' + info.subtitle;
	    }
	    me.setTooltip(title);
	}
    },

    // helper to set the onlineHelp via a config object
    setHelpConfig: function(config) {
	var me = this;
	me.setOnlineHelp(config.onlineHelp);
    },

    handler: function() {
	var me = this;
	var docsURI;

	if (me.onlineHelp) {
	    docsURI = Proxmox.Utils.get_help_link(me.onlineHelp);
	}

	if (docsURI) {
	    window.open(docsURI);
	} else {
	    Ext.Msg.alert(gettext('Help'), gettext('No Help available'));
	}
    },

    initComponent: function() {
	/*jslint confusion: true */
	var me = this;

	me.callParent();

	if  (me.onlineHelp) {
	    me.setOnlineHelp(me.onlineHelp); // set tooltip
	}
    }
});
/* Renders a list of key values objets

mandatory config parameters:
rows: an object container where each propery is a key-value object we want to render
       var rows = {
           keyboard: {
               header: gettext('Keyboard Layout'),
               editor: 'Your.KeyboardEdit',
               required: true
           },

optional:
disabled: setting this parameter to true will disable selection and focus on the
proxmoxObjectGrid as well as greying out input elements.
Useful for a readonly tabular display

*/

Ext.define('Proxmox.grid.ObjectGrid', {
    extend: 'Ext.grid.GridPanel',
    alias: ['widget.proxmoxObjectGrid'],
    disabled: false,
    hideHeaders: true,

    monStoreErrors: false,

    add_combobox_row: function(name, text, opts) {
	var me = this;

	opts = opts || {};
	me.rows = me.rows || {};

	me.rows[name] = {
	    required: true,
	    defaultValue: opts.defaultValue,
	    header: text,
	    renderer: opts.renderer,
	    editor: {
		xtype: 'proxmoxWindowEdit',
		subject: text,
		fieldDefaults: {
		    labelWidth: opts.labelWidth || 100
		},
		items: {
		    xtype: 'proxmoxKVComboBox',
		    name: name,
		    comboItems: opts.comboItems,
		    value: opts.defaultValue,
		    deleteEmpty: opts.deleteEmpty ? true : false,
		    emptyText: opts.defaultValue,
		    labelWidth: Proxmox.Utils.compute_min_label_width(
			text, opts.labelWidth),
		    fieldLabel: text
		}
	    }
	};
    },

    add_text_row: function(name, text, opts) {
	var me = this;

	opts = opts || {};
	me.rows = me.rows || {};

	me.rows[name] = {
	    required: true,
	    defaultValue: opts.defaultValue,
	    header: text,
	    renderer: opts.renderer,
	    editor: {
		xtype: 'proxmoxWindowEdit',
		subject: text,
		fieldDefaults: {
		    labelWidth: opts.labelWidth || 100
		},
		items: {
		    xtype: 'proxmoxtextfield',
		    name: name,
		    deleteEmpty: opts.deleteEmpty ? true : false,
		    emptyText: opts.defaultValue,
		    labelWidth: Proxmox.Utils.compute_min_label_width(
			text, opts.labelWidth),
		    vtype: opts.vtype,
		    fieldLabel: text
		}
	    }
	};
    },

    add_boolean_row: function(name, text, opts) {
	var me = this;

	opts = opts || {};
	me.rows = me.rows || {};

	me.rows[name] = {
	    required: true,
	    defaultValue: opts.defaultValue || 0,
	    header: text,
	    renderer: opts.renderer || Proxmox.Utils.format_boolean,
	    editor: {
		xtype: 'proxmoxWindowEdit',
		subject: text,
		fieldDefaults: {
		    labelWidth: opts.labelWidth || 100
		},
		items: {
		    xtype: 'proxmoxcheckbox',
		    name: name,
		    uncheckedValue: 0,
		    defaultValue: opts.defaultValue  || 0,
		    checked: opts.defaultValue ? true : false,
		    deleteDefaultValue: opts.deleteDefaultValue ? true : false,
		    labelWidth: Proxmox.Utils.compute_min_label_width(
			text, opts.labelWidth),
		    fieldLabel: text
		}
	    }
	};
    },

    add_integer_row: function(name, text, opts) {
	var me = this;

	opts = opts || {}
	me.rows = me.rows || {};

	me.rows[name] = {
	    required: true,
	    defaultValue: opts.defaultValue,
	    header: text,
	    renderer: opts.renderer,
	    editor: {
		xtype: 'proxmoxWindowEdit',
		subject: text,
		fieldDefaults: {
		    labelWidth: opts.labelWidth || 100
		},
		items: {
		    xtype: 'proxmoxintegerfield',
		    name: name,
		    minValue: opts.minValue,
		    maxValue: opts.maxValue,
		    emptyText: gettext('Default'),
		    deleteEmpty: opts.deleteEmpty ? true : false,
		    value: opts.defaultValue,
		    labelWidth: Proxmox.Utils.compute_min_label_width(
			text, opts.labelWidth),
		    fieldLabel: text
		}
	    }
	};
    },

    editorConfig: {}, // default config passed to editor

    run_editor: function() {
	var me = this;

	var sm = me.getSelectionModel();
	var rec = sm.getSelection()[0];
	if (!rec) {
	    return;
	}

	var rows = me.rows;
	var rowdef = rows[rec.data.key];
	if (!rowdef.editor) {
	    return;
	}

	var win;
	var config;
	if (Ext.isString(rowdef.editor)) {
	    config = Ext.apply({
		confid: rec.data.key,
	    },  me.editorConfig);
	    win = Ext.create(rowdef.editor, config);
	} else {
	    config = Ext.apply({
		confid: rec.data.key,
	    },  me.editorConfig);
	    Ext.apply(config, rowdef.editor);
	    win = Ext.createWidget(rowdef.editor.xtype, config);
	    win.load();
	}

	win.show();
	win.on('destroy', me.reload, me);
    },

    reload: function() {
	var me = this;
	me.rstore.load();
    },

    getObjectValue: function(key, defaultValue) {
	var me = this;
	var rec = me.store.getById(key);
	if (rec) {
	    return rec.data.value;
	}
	return defaultValue;
    },

    renderKey: function(key, metaData, record, rowIndex, colIndex, store) {
	var me = this;
	var rows = me.rows;
	var rowdef = (rows && rows[key]) ?  rows[key] : {};
	return rowdef.header || key;
    },

    renderValue: function(value, metaData, record, rowIndex, colIndex, store) {
	var me = this;
	var rows = me.rows;
	var key = record.data.key;
	var rowdef = (rows && rows[key]) ?  rows[key] : {};

	var renderer = rowdef.renderer;
	if (renderer) {
	    return renderer(value, metaData, record, rowIndex, colIndex, store);
	}

	return value;
    },

    listeners: {
	itemkeydown: function(view, record, item, index, e) {
	    if (e.getKey() === e.ENTER) {
		this.pressedIndex = index;
	    }
	},
	itemkeyup: function(view, record, item, index, e) {
	    if (e.getKey() === e.ENTER && index == this.pressedIndex) {
		this.run_editor();
	    }

	    this.pressedIndex = undefined;
	}
    },

    initComponent : function() {
	var me = this;

	var rows = me.rows;

	if (!me.rstore) {
	    if (!me.url) {
		throw "no url specified";
	    }

	    me.rstore = Ext.create('Proxmox.data.ObjectStore', {
		url: me.url,
		interval: me.interval,
		extraParams: me.extraParams,
		rows: me.rows
	    });
	}

	var rstore = me.rstore;

	var store = Ext.create('Proxmox.data.DiffStore', { rstore: rstore,
	    sorters: [],
	    filters: []
	});

	if (rows) {
	    Ext.Object.each(rows, function(key, rowdef) {
		if (Ext.isDefined(rowdef.defaultValue)) {
		    store.add({ key: key, value: rowdef.defaultValue });
		} else if (rowdef.required) {
		    store.add({ key: key, value: undefined });
		}
	    });
	}

	if (me.sorterFn) {
	    store.sorters.add(Ext.create('Ext.util.Sorter', {
		sorterFn: me.sorterFn
	    }));
	}

	store.filters.add(Ext.create('Ext.util.Filter', {
	    filterFn: function(item) {
		if (rows) {
		    var rowdef = rows[item.data.key];
		    if (!rowdef || (rowdef.visible === false)) {
			return false;
		    }
		}
		return true;
	    }
	}));

	Proxmox.Utils.monStoreErrors(me, rstore);

	Ext.applyIf(me, {
	    store: store,
	    stateful: false,
	    columns: [
		{
		    header: gettext('Name'),
		    width: me.cwidth1 || 200,
		    dataIndex: 'key',
		    renderer: me.renderKey
		},
		{
		    flex: 1,
		    header: gettext('Value'),
		    dataIndex: 'value',
		    renderer: me.renderValue
		}
	    ]
	});

	me.callParent();

	if (me.monStoreErrors) {
	    Proxmox.Utils.monStoreErrors(me, me.store);
	}
   }
});
Ext.define('Proxmox.grid.PendingObjectGrid', {
    extend: 'Proxmox.grid.ObjectGrid',
    alias: ['widget.proxmoxPendingObjectGrid'],

    getObjectValue: function(key, defaultValue, pending) {
	var me = this;
	var rec = me.store.getById(key);
	if (rec) {
	    var value = rec.data.value;
	    if (pending) {
		if (Ext.isDefined(rec.data.pending) && rec.data.pending !== '') {
		    value = rec.data.pending;
		} else if (rec.data['delete'] === 1) {
		    value = defaultValue;
		}
	    }

            if (Ext.isDefined(value) && (value !== '')) {
		return value;
            } else {
		return defaultValue;
            }
	}
	return defaultValue;
    },

    hasPendingChanges: function(key) {
	var me = this;
	var rows = me.rows;
	var rowdef = (rows && rows[key]) ?  rows[key] : {};
	var keys = rowdef.multiKey ||  [ key ];
	var pending = false;

	Ext.Array.each(keys, function(k) {
	    var rec = me.store.getById(k);
	    if (rec && rec.data && (
		    (Ext.isDefined(rec.data.pending) && rec.data.pending !== '') ||
		    rec.data['delete'] === 1
	    )) {
		pending = true;
		return false; // break
	    }
	});

	return pending;
    },

    renderValue: function(value, metaData, record, rowIndex, colIndex, store) {
	var me = this;
	var rows = me.rows;
	var key = record.data.key;
	var rowdef = (rows && rows[key]) ?  rows[key] : {};
	var renderer = rowdef.renderer;
	var current = '';
	var pendingdelete = '';
	var pending = '';

	if (renderer) {
	    current = renderer(value, metaData, record, rowIndex, colIndex, store, false);
	    if (me.hasPendingChanges(key)) {
		pending = renderer(record.data.pending, metaData, record, rowIndex, colIndex, store, true);
	    }
	    if (pending == current) {
		pending = undefined;
	    }
	} else {
	    current = value || '';
	    pending = record.data.pending;
	}

	if (record.data['delete']) {
	    var delete_all = true;
	    if (rowdef.multiKey) {
		Ext.Array.each(rowdef.multiKey, function(k) {
		    var rec = me.store.getById(k);
		    if (rec && rec.data && rec.data['delete'] !== 1) {
			delete_all = false;
			return false; // break
		    }
		});
	    }
	    if (delete_all) {
		pending = '<div style="text-decoration: line-through;">'+ current +'</div>';
	    }
	}

	if (pending) {
	    return current + '<div style="color:red">' + pending + '</div>';
	} else {
	    return current;
	}
    },

    initComponent : function() {
	var me = this;

	var rows = me.rows;

	if (!me.rstore) {
	    if (!me.url) {
		throw "no url specified";
	    }

	    me.rstore = Ext.create('Proxmox.data.ObjectStore', {
		model: 'KeyValuePendingDelete',
		readArray: true,
		url: me.url,
		interval: me.interval,
		extraParams: me.extraParams,
		rows: me.rows
	    });
	}

	me.callParent();
   }
});
Ext.define('Proxmox.panel.InputPanel', {
    extend: 'Ext.panel.Panel',
    alias: ['widget.inputpanel'],
    listeners: {
	activate: function() {
	    // notify owning container that it should display a help button
	    if (this.onlineHelp) {
		Ext.GlobalEvents.fireEvent('proxmoxShowHelp', this.onlineHelp);
	    }
	},
	deactivate: function() {
	    if (this.onlineHelp) {
		Ext.GlobalEvents.fireEvent('proxmoxHideHelp', this.onlineHelp);
	    }
	}
    },
    border: false,

    // override this with an URL to a relevant chapter of the pve manual
    // setting this will display a help button in our parent panel
    onlineHelp: undefined,

    // will be set if the inputpanel has advanced items
    hasAdvanced: false,

    // if the panel has advanced items,
    // this will determine if they are shown by default
    showAdvanced: false,

    // overwrite this to modify submit data
    onGetValues: function(values) {
	return values;
    },

    getValues: function(dirtyOnly) {
	var me = this;

	if (Ext.isFunction(me.onGetValues)) {
	    dirtyOnly = false;
	}

	var values = {};

	Ext.Array.each(me.query('[isFormField]'), function(field) {
            if (!dirtyOnly || field.isDirty()) {
                Proxmox.Utils.assemble_field_data(values, field.getSubmitData());
	    }
	});

	return me.onGetValues(values);
    },

    setAdvancedVisible: function(visible) {
	var me = this;
	var advItems = me.getComponent('advancedContainer');
	if (advItems) {
	    advItems.setVisible(visible);
	}
    },

    setValues: function(values) {
	var me = this;

	var form = me.up('form');

        Ext.iterate(values, function(fieldId, val) {
	    var field = me.query('[isFormField][name=' + fieldId + ']')[0];
            if (field) {
		field.setValue(val);
                if (form.trackResetOnLoad) {
                    field.resetOriginalValue();
                }
            }
	});
    },

    initComponent: function() {
	var me = this;

	var items;

	if (me.items) {
	    me.columns = 1;
	    items = [
		{
		    columnWidth: 1,
		    layout: 'anchor',
		    items: me.items
		}
	    ];
	    me.items = undefined;
	} else if (me.column4) {
	    me.columns = 4;
	    items = [
		{
		    columnWidth: 0.25,
		    padding: '0 10 0 0',
		    layout: 'anchor',
		    items: me.column1
		},
		{
		    columnWidth: 0.25,
		    padding: '0 10 0 0',
		    layout: 'anchor',
		    items: me.column2
		},
		{
		    columnWidth: 0.25,
		    padding: '0 10 0 0',
		    layout: 'anchor',
		    items: me.column3
		},
		{
		    columnWidth: 0.25,
		    padding: '0 0 0 10',
		    layout: 'anchor',
		    items: me.column4
		}
	    ];
	    if (me.columnB) {
		items.push({
		    columnWidth: 1,
		    padding: '10 0 0 0',
		    layout: 'anchor',
		    items: me.columnB
		});
	    }
	} else if (me.column1) {
	    me.columns = 2;
	    items = [
		{
		    columnWidth: 0.5,
		    padding: '0 10 0 0',
		    layout: 'anchor',
		    items: me.column1
		},
		{
		    columnWidth: 0.5,
		    padding: '0 0 0 10',
		    layout: 'anchor',
		    items: me.column2 || [] // allow empty column
		}
	    ];
	    if (me.columnB) {
		items.push({
		    columnWidth: 1,
		    padding: '10 0 0 0',
		    layout: 'anchor',
		    items: me.columnB
		});
	    }
	} else {
	    throw "unsupported config";
	}

	var advItems;
	if (me.advancedItems) {
	    advItems = [
		{
		    columnWidth: 1,
		    layout: 'anchor',
		    items: me.advancedItems
		}
	    ];
	    me.advancedItems = undefined;
	} else if (me.advancedColumn1) {
	    advItems = [
		{
		    columnWidth: 0.5,
		    padding: '0 10 0 0',
		    layout: 'anchor',
		    items: me.advancedColumn1
		},
		{
		    columnWidth: 0.5,
		    padding: '0 0 0 10',
		    layout: 'anchor',
		    items: me.advancedColumn2 || [] // allow empty column
		}
	    ];

	    me.advancedColumn1 = undefined;
	    me.advancedColumn2 = undefined;

	    if (me.advancedColumnB) {
		advItems.push({
		    columnWidth: 1,
		    padding: '10 0 0 0',
		    layout: 'anchor',
		    items: me.advancedColumnB
		});
		me.advancedColumnB = undefined;
	    }
	}

	if (advItems) {
	    me.hasAdvanced = true;
	    advItems.unshift({
		columnWidth: 1,
		xtype: 'box',
		hidden: false,
		border: true,
		autoEl: {
		    tag: 'hr'
		}
	    });
	    items.push({
		columnWidth: 1,
		xtype: 'container',
		itemId: 'advancedContainer',
		hidden: !me.showAdvanced,
		layout: 'column',
		defaults: {
		    border: false
		},
		items: advItems
	    });
	}

	if (me.useFieldContainer) {
	    Ext.apply(me, {
		layout: 'fit',
		items: Ext.apply(me.useFieldContainer, {
		    layout: 'column',
		    defaultType: 'container',
		    items: items
		})
	    });
	} else {
	    Ext.apply(me, {
		layout: 'column',
		defaultType: 'container',
		items: items
	    });
	}

	me.callParent();
    }
});
/*
 * Display log entries in a panel with scrollbar
 * The log entries are automatically refreshed via a background task,
 * with newest entries comming at the bottom
 */
Ext.define('Proxmox.panel.LogView', {
    extend: 'Ext.panel.Panel',
    xtype: 'proxmoxLogView',

    pageSize: 500,
    viewBuffer: 50,
    lineHeight: 16,

    scrollToEnd: true,

    // callback for load failure, used for ceph
    failCallback: undefined,

    controller: {
	xclass: 'Ext.app.ViewController',

	updateParams: function() {
	    var me = this;
	    var viewModel = me.getViewModel();
	    var since = viewModel.get('since');
	    var until = viewModel.get('until');
	    if (viewModel.get('hide_timespan')) {
		return;
	    }

	    if (since > until) {
		Ext.Msg.alert('Error', 'Since date must be less equal than Until date.');
		return;
	    }

	    viewModel.set('params.since', Ext.Date.format(since, 'Y-m-d'));
	    viewModel.set('params.until', Ext.Date.format(until, 'Y-m-d') + ' 23:59:59');
	    me.getView().loadTask.delay(200);
	},

	scrollPosBottom: function() {
	    var view = this.getView();
	    var pos = view.getScrollY();
	    var maxPos = view.getScrollable().getMaxPosition().y;
	    return maxPos - pos;
	},

	updateView: function(text, first, total) {
	    var me = this;
	    var view = me.getView();
	    var viewModel = me.getViewModel();
	    var content = me.lookup('content');
	    var data = viewModel.get('data');

	    if (first === data.first && total === data.total && text.length === data.textlen) {
		return; // same content, skip setting and scrolling
	    }
	    viewModel.set('data', {
		first: first,
		total: total,
		textlen: text.length
	    });

	    var scrollPos = me.scrollPosBottom();

	    content.update(text);

	    if (view.scrollToEnd && scrollPos <= 0) {
		// we use setTimeout to work around scroll handling on touchscreens
		setTimeout(function() { view.scrollTo(0, Infinity); }, 10);
	    }
	},

	doLoad: function() {
	    var me = this;
	    if (me.running) {
		me.requested = true;
		return;
	    }
	    me.running = true;
	    var view = me.getView();
	    var viewModel = me.getViewModel();
	    Proxmox.Utils.API2Request({
		url: me.getView().url,
		params: viewModel.get('params'),
		method: 'GET',
		success: function(response) {
		    Proxmox.Utils.setErrorMask(me, false);
		    var total = response.result.total;
		    var lines = new Array();
		    var first = Infinity;

		    Ext.Array.each(response.result.data, function(line) {
			if (first > line.n) {
			    first = line.n;
			}
			lines[line.n - 1] = Ext.htmlEncode(line.t);
		    });

		    lines.length = total;
		    me.updateView(lines.join('<br>'), first - 1, total);
		    me.running = false;
		    if (me.requested) {
			me.requested = false;
			view.loadTask.delay(200);
		    }
		},
		failure: function(response) {
		    if (view.failCallback) {
			view.failCallback(response);
		    } else {
			var msg = response.htmlStatus;
			Proxmox.Utils.setErrorMask(me, msg);
		    }
		    me.running = false;
		    if (me.requested) {
			me.requested = false;
			view.loadTask.delay(200);
		    }
		}
	    });
	},

	onScroll: function(x, y) {
	    var me = this;
	    var view = me.getView();
	    var viewModel = me.getViewModel();

	    var lineHeight = view.lineHeight;
	    var line = view.getScrollY()/lineHeight;
	    var start = viewModel.get('params.start');
	    var limit = viewModel.get('params.limit');
	    var viewLines = view.getHeight()/lineHeight;

	    var viewStart = Math.max(parseInt(line - 1 - view.viewBuffer, 10), 0);
	    var viewEnd = parseInt(line + viewLines + 1 + view.viewBuffer, 10);

	    if (viewStart < start || viewEnd > (start+limit)) {
		viewModel.set('params.start',
		    Math.max(parseInt(line - limit/2 + 10, 10), 0));
		view.loadTask.delay(200);
	    }
	},

	init: function(view) {
	    var me = this;

	    if (!view.url) {
		throw "no url specified";
	    }

	    var viewModel = this.getViewModel();
	    var since = new Date();
	    since.setDate(since.getDate() - 3);
	    viewModel.set('until', new Date());
	    viewModel.set('since', since);
	    viewModel.set('params.limit', view.pageSize);
	    viewModel.set('hide_timespan', !view.log_select_timespan);
	    me.lookup('content').setStyle('line-height', view.lineHeight + 'px');

	    view.loadTask = new Ext.util.DelayedTask(me.doLoad, me);

	    me.updateParams();
	    view.task = Ext.TaskManager.start({
		run: function() {
		    if (!view.isVisible() || !view.scrollToEnd) {
			return;
		    }

		    if (me.scrollPosBottom() <= 1) {
			view.loadTask.delay(200);
		    }
		},
		interval: 1000
	    });
	}
    },

    onDestroy: function() {
	var me = this;
	me.loadTask.cancel();
	Ext.TaskManager.stop(me.task);
    },

    // for user to initiate a load from outside
    requestUpdate: function() {
	var me = this;
	me.loadTask.delay(200);
    },

    viewModel: {
	data: {
	    until: null,
	    since: null,
	    hide_timespan: false,
	    data: {
		start: 0,
		total: 0,
		textlen: 0
	    },
	    params: {
		start: 0,
		limit: 500,
	    }
	}
    },

    layout: 'auto',
    bodyPadding: 5,
    scrollable: {
	x: 'auto',
	y: 'auto',
	listeners: {
	    // we have to have this here, since we cannot listen to events
	    // of the scroller in the viewcontroller (extjs bug?), nor does
	    // the panel have a 'scroll' event'
	    scroll: {
		fn: function(scroller, x, y) {
		    var controller = this.component.getController();
		    if (controller) { // on destroy, controller can be gone
			controller.onScroll(x,y);
		    }
		},
		buffer: 200
	    },
	}
    },

    tbar: {
	bind: {
	    hidden: '{hide_timespan}'
	},
	items: [
	    '->',
	    'Since: ',
	    {
		xtype: 'datefield',
		name: 'since_date',
		reference: 'since',
		format: 'Y-m-d',
		bind: {
		    value: '{since}',
		    maxValue: '{until}'
		}
	    },
	    'Until: ',
	    {
		xtype: 'datefield',
		name: 'until_date',
		reference: 'until',
		format: 'Y-m-d',
		bind: {
		    value: '{until}',
		    minValue: '{since}'
		}
	    },
	    {
		xtype: 'button',
		text: 'Update',
		handler: 'updateParams'
	    }
	],
    },

    items: [
	{
	    xtype: 'box',
	    reference: 'content',
	    style: {
		font: 'normal 11px tahoma, arial, verdana, sans-serif',
		'white-space': 'pre'
	    },
	}
    ]
});
/*
 * Display log entries in a panel with scrollbar
 * The log entries are automatically refreshed via a background task,
 * with newest entries comming at the bottom
 */
Ext.define('Proxmox.panel.JournalView', {
    extend: 'Ext.panel.Panel',
    xtype: 'proxmoxJournalView',

    numEntries: 500,
    lineHeight: 16,

    scrollToEnd: true,

    controller: {
	xclass: 'Ext.app.ViewController',

	updateParams: function() {
	    var me = this;
	    var viewModel = me.getViewModel();
	    var since = viewModel.get('since');
	    var until = viewModel.get('until');

	    since.setHours(0, 0, 0, 0);
	    until.setHours(0, 0, 0, 0);
	    until.setDate(until.getDate()+1);

	    me.getView().loadTask.delay(200, undefined, undefined, [
		false,
		false,
		Ext.Date.format(since, "U"),
		Ext.Date.format(until, "U")
	    ]);
	},

	scrollPosBottom: function() {
	    var view = this.getView();
	    var pos = view.getScrollY();
	    var maxPos = view.getScrollable().getMaxPosition().y;
	    return maxPos - pos;
	},

	scrollPosTop: function() {
	    var view = this.getView();
	    return view.getScrollY();
	},

	updateScroll: function(livemode, num, scrollPos, scrollPosTop) {
	    var me = this;
	    var view = me.getView();

	    if (!livemode) {
		setTimeout(function() { view.scrollTo(0, 0); }, 10);
	    } else if (view.scrollToEnd && scrollPos <= 0) {
		setTimeout(function() { view.scrollTo(0, Infinity); }, 10);
	    } else if (!view.scrollToEnd && scrollPosTop < 20*view.lineHeight) {
		setTimeout(function() { view.scrollTo(0, num*view.lineHeight + scrollPosTop); }, 10);
	    }
	},

	updateView: function(lines, livemode, top) {
	    var me = this;
	    var view = me.getView();
	    var viewmodel = me.getViewModel();
	    if (viewmodel.get('livemode') !== livemode) {
		return; // we switched mode, do not update the content
	    }
	    var contentEl = me.lookup('content');

	    // save old scrollpositions
	    var scrollPos = me.scrollPosBottom();
	    var scrollPosTop = me.scrollPosTop();

	    var newend = lines.shift();
	    var newstart = lines.pop();

	    var num = lines.length;
	    var text = lines.map(Ext.htmlEncode).join('<br>');

	    if (!livemode) {
		if (num) {
		    view.content = text;
		} else {
		    view.content = 'nothing logged or no timespan selected';
		}
	    } else {
		// update content
		if (top && num) {
		    view.content = view.content ? text + '<br>' + view.content : text;
		} else if (!top && num) {
		    view.content = view.content ? view.content + '<br>' + text : text;
		}

		// update cursors
		if (!top || !view.startcursor) {
		    view.startcursor = newstart;
		}

		if (top || !view.endcursor) {
		    view.endcursor = newend;
		}
	    }

	    contentEl.update(view.content);

	    me.updateScroll(livemode, num, scrollPos, scrollPosTop);
	},

	doLoad: function(livemode, top, since, until) {
	    var me = this;
	    if (me.running) {
		me.requested = true;
		return;
	    }
	    me.running = true;
	    var view = me.getView();
	    var params = {
		lastentries: view.numEntries || 500,
	    };
	    if (livemode) {
		if (!top && view.startcursor) {
		    params = {
			startcursor: view.startcursor
		    };
		} else if (view.endcursor) {
		    params.endcursor = view.endcursor;
		}
	    } else {
		params = {
		    since: since,
		    until: until
		};
	    }
	    Proxmox.Utils.API2Request({
		url: view.url,
		params: params,
		waitMsgTarget: (!livemode) ? view : undefined,
		method: 'GET',
		success: function(response) {
		    Proxmox.Utils.setErrorMask(me, false);
		    var lines = response.result.data;
		    me.updateView(lines, livemode, top);
		    me.running = false;
		    if (me.requested) {
			me.requested = false;
			view.loadTask.delay(200);
		    }
		},
		failure: function(response) {
		    var msg = response.htmlStatus;
		    Proxmox.Utils.setErrorMask(me, msg);
		    me.running = false;
		    if (me.requested) {
			me.requested = false;
			view.loadTask.delay(200);
		    }
		}
	    });
	},

	onScroll: function(x, y) {
	    var me = this;
	    var view = me.getView();
	    var viewmodel = me.getViewModel();
	    var livemode = viewmodel.get('livemode');
	    if (!livemode) {
		return;
	    }

	    if (me.scrollPosTop() < 20*view.lineHeight) {
		view.scrollToEnd = false;
		view.loadTask.delay(200, undefined, undefined, [true, true]);
	    } else if (me.scrollPosBottom() <= 1) {
		view.scrollToEnd = true;
	    }
	},

	init: function(view) {
	    var me = this;

	    if (!view.url) {
		throw "no url specified";
	    }

	    var viewmodel = me.getViewModel();
	    var viewModel = this.getViewModel();
	    var since = new Date();
	    since.setDate(since.getDate() - 3);
	    viewModel.set('until', new Date());
	    viewModel.set('since', since);
	    me.lookup('content').setStyle('line-height', view.lineHeight + 'px');

	    view.loadTask = new Ext.util.DelayedTask(me.doLoad, me, [true, false]);

	    me.updateParams();
	    view.task = Ext.TaskManager.start({
		run: function() {
		    if (!view.isVisible() || !view.scrollToEnd || !viewmodel.get('livemode')) {
			return;
		    }

		    if (me.scrollPosBottom() <= 1) {
			view.loadTask.delay(200, undefined, undefined, [true, false]);
		    }
		},
		interval: 1000
	    });
	},

	onLiveMode: function() {
	    var me = this;
	    var view = me.getView();
	    delete view.startcursor;
	    delete view.endcursor;
	    delete view.content;
	    me.getViewModel().set('livemode', true);
	    view.scrollToEnd = true;
	    me.updateView([], true, false);
	},

	onTimespan: function() {
	    var me = this;
	    me.getViewModel().set('livemode', false);
	    me.updateView([], false);
	}
    },

    onDestroy: function() {
	var me = this;
	me.loadTask.cancel();
	Ext.TaskManager.stop(me.task);
	delete me.content;
    },

    // for user to initiate a load from outside
    requestUpdate: function() {
	var me = this;
	me.loadTask.delay(200);
    },

    viewModel: {
	data: {
	    livemode: true,
	    until: null,
	    since: null
	}
    },

    layout: 'auto',
    bodyPadding: 5,
    scrollable: {
	x: 'auto',
	y: 'auto',
	listeners: {
	    // we have to have this here, since we cannot listen to events
	    // of the scroller in the viewcontroller (extjs bug?), nor does
	    // the panel have a 'scroll' event'
	    scroll: {
		fn: function(scroller, x, y) {
		    var controller = this.component.getController();
		    if (controller) { // on destroy, controller can be gone
			controller.onScroll(x,y);
		    }
		},
		buffer: 200
	    },
	}
    },

    tbar: {

	items: [
	    '->',
	    {
		xtype: 'segmentedbutton',
		items: [
		    {
			text: gettext('Live Mode'),
			bind: {
			    pressed: '{livemode}'
			},
			handler: 'onLiveMode',
		    },
		    {
			text: gettext('Select Timespan'),
			bind: {
			    pressed: '{!livemode}'
			},
			handler: 'onTimespan',
		    }
		]
	    },
	    {
		xtype: 'box',
		bind: { disabled: '{livemode}' },
		autoEl: { cn: gettext('Since') + ':' }
	    },
	    {
		xtype: 'datefield',
		name: 'since_date',
		reference: 'since',
		format: 'Y-m-d',
		bind: {
		    disabled: '{livemode}',
		    value: '{since}',
		    maxValue: '{until}'
		}
	    },
	    {
		xtype: 'box',
		bind: { disabled: '{livemode}' },
		autoEl: { cn: gettext('Until') + ':' }
	    },
	    {
		xtype: 'datefield',
		name: 'until_date',
		reference: 'until',
		format: 'Y-m-d',
		bind: {
		    disabled: '{livemode}',
		    value: '{until}',
		    minValue: '{since}'
		}
	    },
	    {
		xtype: 'button',
		text: 'Update',
		reference: 'updateBtn',
		handler: 'updateParams',
		bind: {
		    disabled: '{livemode}'
		}
	    }
	]
    },

    items: [
	{
	    xtype: 'box',
	    reference: 'content',
	    style: {
		font: 'normal 11px tahoma, arial, verdana, sans-serif',
		'white-space': 'pre'
	    },
	}
    ]
});
Ext.define('Proxmox.widget.RRDChart', {
    extend: 'Ext.chart.CartesianChart',
    alias: 'widget.proxmoxRRDChart',

    unit: undefined, // bytes, bytespersecond, percent

    controller: {
	xclass: 'Ext.app.ViewController',

	convertToUnits: function(value) {
	    var units = ['', 'k','M','G','T', 'P'];
	    var si = 0;
	    while(value >= 1000  && si < (units.length -1)){
		value = value / 1000;
		si++;
	    }

	    // javascript floating point weirdness
	    value = Ext.Number.correctFloat(value);

	    // limit to 2 decimal points
	    value = Ext.util.Format.number(value, "0.##");

	    return value.toString() + " " + units[si];
	},

	leftAxisRenderer: function(axis, label, layoutContext) {
	    var me = this;

	    return me.convertToUnits(label);
	},

	onSeriesTooltipRender: function(tooltip, record, item) {
	    var me = this.getView();

	    var suffix = '';

	    if (me.unit === 'percent') {
		suffix = '%';
	    } else if (me.unit === 'bytes') {
		suffix = 'B';
	    } else if (me.unit === 'bytespersecond') {
		suffix = 'B/s';
	    }

	    var prefix = item.field;
	    if (me.fieldTitles && me.fieldTitles[me.fields.indexOf(item.field)]) {
		prefix = me.fieldTitles[me.fields.indexOf(item.field)];
	    }
            tooltip.setHtml(prefix + ': ' + this.convertToUnits(record.get(item.field)) + suffix +
			    '<br>' + new Date(record.get('time')));
	},

	onAfterAnimation: function(chart, eopts) {
	    // if the undobuton is disabled,
	    // disable our tool

	    var ourUndoZoomButton = chart.tools[0];
	    var undoButton = chart.interactions[0].getUndoButton();
	    ourUndoZoomButton.setDisabled(undoButton.isDisabled());
	}
    },

    width: 770,
    height: 300,
    animation: false,
    interactions: [{
	type: 'crosszoom'
    }],
    axes: [{
	type: 'numeric',
	position: 'left',
	grid: true,
	renderer: 'leftAxisRenderer',
	//renderer: function(axis, label) { return label; },
	minimum: 0
    }, {
	type: 'time',
	position: 'bottom',
	grid: true,
	fields: ['time']
    }],
    legend: {
	docked: 'bottom'
    },
    listeners: {
	animationend: 'onAfterAnimation'
    },


    initComponent: function() {
	var me = this;
	var series = {};

	if (!me.store) {
	    throw "cannot work without store";
	}

	if (!me.fields) {
	    throw "cannot work without fields";
	}

	me.callParent();

	// add correct label for left axis
	var axisTitle = "";
	if (me.unit === 'percent') {
	    axisTitle = "%";
	} else if (me.unit === 'bytes') {
	    axisTitle = "Bytes";
	} else if (me.unit === 'bytespersecond') {
	    axisTitle = "Bytes/s";
	} else if (me.fieldTitles && me.fieldTitles.length === 1) {
	    axisTitle = me.fieldTitles[0];
	} else if (me.fields.length === 1) {
	    axisTitle = me.fields[0];
	}

	me.axes[0].setTitle(axisTitle);

	if (!me.noTool) {
	    me.addTool([{
		type: 'minus',
		disabled: true,
		tooltip: gettext('Undo Zoom'),
		handler: function(){
		    var undoButton = me.interactions[0].getUndoButton();
		    if (undoButton.handler) {
			undoButton.handler();
		    }
		}
	    },{
		type: 'restore',
		tooltip: gettext('Toggle Legend'),
		handler: function(){
		    if (me.legend) {
			me.legend.setVisible(!me.legend.isVisible());
		    }
		}
	    }]);
	}

	// add a series for each field we get
	me.fields.forEach(function(item, index){
	    var title = item;
	    if (me.fieldTitles && me.fieldTitles[index]) {
		title = me.fieldTitles[index];
	    }
	    me.addSeries(Ext.apply(
		{
		    type: 'line',
		    xField: 'time',
		    yField: item,
		    title: title,
		    fill: true,
		    style: {
			lineWidth: 1.5,
			opacity: 0.60
		    },
		    marker: {
			opacity: 0,
			scaling: 0.01,
			fx: {
			    duration: 200,
			    easing: 'easeOut'
			}
		    },
		    highlightCfg: {
			opacity: 1,
			scaling: 1.5
		    },
		    tooltip: {
			trackMouse: true,
			renderer: 'onSeriesTooltipRender'
		    }
		},
		me.seriesConfig
	    ));
	});

	// enable animation after the store is loaded
	me.store.onAfter('load', function() {
	    me.setAnimation(true);
	}, this, {single: true});
    }
});
Ext.define('Proxmox.panel.GaugeWidget', {
    extend: 'Ext.panel.Panel',
    alias: 'widget.proxmoxGauge',

    defaults: {
	style: {
	    'text-align':'center'
	}
    },
    items: [
	{
	    xtype: 'box',
	    itemId: 'title',
	    data: {
		title: ''
	    },
	    tpl: '<h3>{title}</h3>'
	},
	{
	    xtype: 'polar',
	    height: 120,
	    border: false,
	    itemId: 'chart',
	    series: [{
		type: 'gauge',
		value: 0,
		colors: ['#f5f5f5'],
		sectors: [0],
		donut: 90,
		needleLength: 100,
		totalAngle: Math.PI
	    }],
	    sprites: [{
		id: 'valueSprite',
		type: 'text',
		text: '',
		textAlign: 'center',
		textBaseline: 'bottom',
		x: 125,
		y: 110,
		fontSize: 30
	    }]
	},
	{
	    xtype: 'box',
	    itemId: 'text'
	}
    ],

    header: false,
    border: false,

    warningThreshold: 0.6,
    criticalThreshold: 0.9,
    warningColor: '#fc0',
    criticalColor: '#FF6C59',
    defaultColor: '#c2ddf2',
    backgroundColor: '#f5f5f5',

    initialValue: 0,


    updateValue: function(value, text) {
	var me = this;
	var color = me.defaultColor;
	var attr = {};

	if (value >= me.criticalThreshold) {
	    color = me.criticalColor;
	} else if (value >= me.warningThreshold) {
	    color = me.warningColor;
	}

	me.chart.series[0].setColors([color, me.backgroundColor]);
	me.chart.series[0].setValue(value*100);

	me.valueSprite.setText(' '+(value*100).toFixed(0) + '%');
	attr.x = me.chart.getWidth()/2;
	attr.y = me.chart.getHeight()-20;
	if (me.spriteFontSize) {
	    attr.fontSize = me.spriteFontSize;
	}
	me.valueSprite.setAttributes(attr, true);

	if (text !== undefined) {
	    me.text.setHtml(text);
	}
    },

    initComponent: function() {
	var me = this;

	me.callParent();

	if (me.title) {
	    me.getComponent('title').update({title: me.title});
	}
	me.text = me.getComponent('text');
	me.chart = me.getComponent('chart');
	me.valueSprite = me.chart.getSurface('chart').get('valueSprite');
    }
});
// fixme: how can we avoid those lint errors?
/*jslint confusion: true */
Ext.define('Proxmox.window.Edit', {
    extend: 'Ext.window.Window',
    alias: 'widget.proxmoxWindowEdit',

    // autoLoad trigger a load() after component creation
    autoLoad: false,

    resizable: false,

    // use this tio atimatically generate a title like
    // Create: <subject>
    subject: undefined,

    // set isCreate to true if you want a Create button (instead
    // OK and RESET)
    isCreate: false,

    // set to true if you want an Add button (instead of Create)
    isAdd: false,

    // set to true if you want an Remove button (instead of Create)
    isRemove: false,

    // custom submitText
    submitText: undefined,

    backgroundDelay: 0,

    // needed for finding the reference to submitbutton
    // because we do not have a controller
    referenceHolder: true,
    defaultButton: 'submitbutton',

    // finds the first form field
    defaultFocus: 'field[disabled=false][hidden=false]',

    showProgress: false,

    showTaskViewer: false,

    // gets called if we have a progress bar or taskview and it detected that
    // the task finished. function(success)
    taskDone: Ext.emptyFn,

    // gets called when the api call is finished, right at the beginning
    // function(success, response, options)
    apiCallDone: Ext.emptyFn,

    // assign a reference from docs, to add a help button docked to the
    // bottom of the window. If undefined we magically fall back to the
    // onlineHelp of our first item, if set.
    onlineHelp: undefined,

    isValid: function() {
	var me = this;

	var form = me.formPanel.getForm();
	return form.isValid();
    },

    getValues: function(dirtyOnly) {
	var me = this;

        var values = {};

	var form = me.formPanel.getForm();

        form.getFields().each(function(field) {
            if (!field.up('inputpanel') && (!dirtyOnly || field.isDirty())) {
                Proxmox.Utils.assemble_field_data(values, field.getSubmitData());
            }
        });

	Ext.Array.each(me.query('inputpanel'), function(panel) {
	    Proxmox.Utils.assemble_field_data(values, panel.getValues(dirtyOnly));
	});

        return values;
    },

    setValues: function(values) {
	var me = this;

	var form = me.formPanel.getForm();

	Ext.iterate(values, function(fieldId, val) {
	    var field = form.findField(fieldId);
	    if (field && !field.up('inputpanel')) {
               field.setValue(val);
                if (form.trackResetOnLoad) {
                    field.resetOriginalValue();
                }
            }
	});

	Ext.Array.each(me.query('inputpanel'), function(panel) {
	    panel.setValues(values);
	});
    },

    submit: function() {
	var me = this;

	var form = me.formPanel.getForm();

	var values = me.getValues();
	Ext.Object.each(values, function(name, val) {
	    if (values.hasOwnProperty(name)) {
                if (Ext.isArray(val) && !val.length) {
		    values[name] = '';
		}
	    }
	});

	if (me.digest) {
	    values.digest = me.digest;
	}

	if (me.backgroundDelay) {
	    values.background_delay = me.backgroundDelay;
	}

	var url =  me.url;
	if (me.method === 'DELETE') {
	    url = url + "?" + Ext.Object.toQueryString(values);
	    values = undefined;
	}

	Proxmox.Utils.API2Request({
	    url: url,
	    waitMsgTarget: me,
	    method: me.method || (me.backgroundDelay ? 'POST' : 'PUT'),
	    params: values,
	    failure: function(response, options) {
		me.apiCallDone(false, response, options);

		if (response.result && response.result.errors) {
		    form.markInvalid(response.result.errors);
		}
		Ext.Msg.alert(gettext('Error'), response.htmlStatus);
	    },
	    success: function(response, options) {
		var hasProgressBar = (me.backgroundDelay || me.showProgress || me.showTaskViewer) &&
		    response.result.data ? true : false;

		me.apiCallDone(true, response, options);

		if (hasProgressBar) {
		    // stay around so we can trigger our close events
		    // when background action is completed
		    me.hide();

		    var upid = response.result.data;
		    var viewerClass = me.showTaskViewer ? 'Viewer' : 'Progress';
		    var win = Ext.create('Proxmox.window.Task' + viewerClass, {
			upid: upid,
			taskDone: me.taskDone,
			listeners: {
			    destroy: function () {
				me.close();
			    }
			}
		    });
		    win.show();
		} else {
		    me.close();
		}
	    }
	});
    },

    load: function(options) {
	var me = this;

	var form = me.formPanel.getForm();

	options = options || {};

	var newopts = Ext.apply({
	    waitMsgTarget: me
	}, options);

	var createWrapper = function(successFn) {
	    Ext.apply(newopts, {
		url: me.url,
		method: 'GET',
		success: function(response, opts) {
		    form.clearInvalid();
		    me.digest = response.result.data.digest;
		    if (successFn) {
			successFn(response, opts);
		    } else {
			me.setValues(response.result.data);
		    }
		    // hack: fix ExtJS bug
		    Ext.Array.each(me.query('radiofield'), function(f) {
			f.resetOriginalValue();
		    });
		},
		failure: function(response, opts) {
		    Ext.Msg.alert(gettext('Error'), response.htmlStatus, function() {
			me.close();
		    });
		}
	    });
	};

	createWrapper(options.success);

	Proxmox.Utils.API2Request(newopts);
    },

    initComponent : function() {
	var me = this;

	if (!me.url) {
	    throw "no url specified";
	}

	if (me.create) {throw "deprecated parameter, use isCreate";}

	var items = Ext.isArray(me.items) ? me.items : [ me.items ];

	me.items = undefined;

	me.formPanel = Ext.create('Ext.form.Panel', {
	    url: me.url,
	    method: me.method || 'PUT',
	    trackResetOnLoad: true,
	    bodyPadding: 10,
	    border: false,
	    defaults: Ext.apply({}, me.defaults, {
		border: false
	    }),
	    fieldDefaults: Ext.apply({}, me.fieldDefaults, {
		labelWidth: 100,
		anchor: '100%'
            }),
	    items: items
	});

	var inputPanel = me.formPanel.down('inputpanel');

	var form = me.formPanel.getForm();

	var submitText;
	if (me.isCreate) {
	    if (me.submitText) {
		submitText = me.submitText;
	    } else if (me.isAdd) {
		submitText = gettext('Add');
	    } else if (me.isRemove) {
		submitText = gettext('Remove');
	    } else {
		submitText = gettext('Create');
	    }
	} else {
	    submitText = me.submitText || gettext('OK');
	}

	var submitBtn = Ext.create('Ext.Button', {
	    reference: 'submitbutton',
	    text: submitText,
	    disabled: !me.isCreate,
	    handler: function() {
		me.submit();
	    }
	});

	var resetBtn = Ext.create('Ext.Button', {
	    text: 'Reset',
	    disabled: true,
	    handler: function(){
		form.reset();
	    }
	});

	var set_button_status = function() {
	    var valid = form.isValid();
	    var dirty = form.isDirty();
	    submitBtn.setDisabled(!valid || !(dirty || me.isCreate));
	    resetBtn.setDisabled(!dirty);

	    if (inputPanel && inputPanel.hasAdvanced) {
		// we want to show the advanced options
		// as soon as some of it is not valid
		var advancedItems = me.down('#advancedContainer').query('field');
		var valid = true;
		advancedItems.forEach(function(field) {
		    if (!field.isValid()) {
			valid = false;
		    }
		});

		if (!valid) {
		    inputPanel.setAdvancedVisible(true);
		    me.down('#advancedcb').setValue(true);
		}
	    }
	};

	form.on('dirtychange', set_button_status);
	form.on('validitychange', set_button_status);

	var colwidth = 300;
	if (me.fieldDefaults && me.fieldDefaults.labelWidth) {
	    colwidth += me.fieldDefaults.labelWidth - 100;
	}

	var twoColumn = inputPanel &&
	    (inputPanel.column1 || inputPanel.column2);

	if (me.subject && !me.title) {
	    me.title = Proxmox.Utils.dialog_title(me.subject, me.isCreate, me.isAdd);
	}

	if (me.isCreate) {
		me.buttons = [ submitBtn ] ;
	} else {
		me.buttons = [ submitBtn, resetBtn ];
	}

	if (inputPanel && inputPanel.hasAdvanced) {
	    var sp = Ext.state.Manager.getProvider();
	    var advchecked = sp.get('proxmox-advanced-cb');
	    inputPanel.setAdvancedVisible(advchecked);
	    me.buttons.unshift(
	       {
		   xtype: 'proxmoxcheckbox',
		   itemId: 'advancedcb',
		   boxLabelAlign: 'before',
		   boxLabel: gettext('Advanced'),
		   stateId: 'proxmox-advanced-cb',
		   value: advchecked,
		   listeners: {
		       change: function(cb, val) {
			   inputPanel.setAdvancedVisible(val);
			   sp.set('proxmox-advanced-cb', val);
		       }
		   }
	       }
	    );
	}

	var onlineHelp = me.onlineHelp;
	if (!onlineHelp && inputPanel && inputPanel.onlineHelp) {
	    onlineHelp = inputPanel.onlineHelp;
	}

	if (onlineHelp) {
	    var helpButton = Ext.create('Proxmox.button.Help');
	    me.buttons.unshift(helpButton, '->');
	    Ext.GlobalEvents.fireEvent('proxmoxShowHelp', onlineHelp);
	}

	Ext.applyIf(me, {
	    modal: true,
	    width: twoColumn ? colwidth*2 : colwidth,
	    border: false,
	    items: [ me.formPanel ]
	});

	me.callParent();

	// always mark invalid fields
	me.on('afterlayout', function() {
	    // on touch devices, the isValid function
	    // triggers a layout, which triggers an isValid
	    // and so on
	    // to prevent this we disable the layouting here
	    // and enable it afterwards
	    me.suspendLayout = true;
	    me.isValid();
	    me.suspendLayout = false;
	});

	if (me.autoLoad) {
	    me.load();
	}
    }
});
Ext.define('Proxmox.window.PasswordEdit', {
    extend: 'Proxmox.window.Edit',
    alias: 'proxmoxWindowPasswordEdit',

    subject: gettext('Password'),

    url: '/api2/extjs/access/password',

    fieldDefaults: {
	labelWidth: 120
    },

    items: [
	{
	    xtype: 'textfield',
	    inputType: 'password',
	    fieldLabel: gettext('Password'),
	    minLength: 5,
	    allowBlank: false,
	    name: 'password',
	    listeners: {
                change: function(field){
		    field.next().validate();
                },
                blur: function(field){
		    field.next().validate();
                }
	    }
	},
	{
	    xtype: 'textfield',
	    inputType: 'password',
	    fieldLabel: gettext('Confirm password'),
	    name: 'verifypassword',
	    allowBlank: false,
	    vtype: 'password',
	    initialPassField: 'password',
	    submitValue: false
	},
	{
	    xtype: 'hiddenfield',
	    name: 'userid'
	}
    ],

    initComponent : function() {
	var me = this;

	if (!me.userid) {
	    throw "no userid specified";
	}

	me.callParent();
	me.down('[name=userid]').setValue(me.userid);
    }
});
Ext.define('Proxmox.window.TaskProgress', {
    extend: 'Ext.window.Window',
    alias: 'widget.proxmoxTaskProgress',

    taskDone: Ext.emptyFn,

    initComponent: function() {
        var me = this;

	if (!me.upid) {
	    throw "no task specified";
	}

	var task = Proxmox.Utils.parse_task_upid(me.upid);

	var statstore = Ext.create('Proxmox.data.ObjectStore', {
            url: "/api2/json/nodes/" + task.node + "/tasks/" + me.upid + "/status",
	    interval: 1000,
	    rows: {
		status: { defaultValue: 'unknown' },
		exitstatus: { defaultValue: 'unknown' }
	    }
	});

	me.on('destroy', statstore.stopUpdate);

	var getObjectValue = function(key, defaultValue) {
	    var rec = statstore.getById(key);
	    if (rec) {
		return rec.data.value;
	    }
	    return defaultValue;
	};

	var pbar = Ext.create('Ext.ProgressBar', { text: 'running...' });

	me.mon(statstore, 'load', function() {
	    var status = getObjectValue('status');
	    if (status === 'stopped') {
		var exitstatus = getObjectValue('exitstatus');
		if (exitstatus == 'OK') {
		    pbar.reset();
		    pbar.updateText("Done!");
		    Ext.Function.defer(me.close, 1000, me);
		} else {
		    me.close();
		    Ext.Msg.alert('Task failed', exitstatus);
		}
		me.taskDone(exitstatus == 'OK');
	    }
	});

	var descr = Proxmox.Utils.format_task_description(task.type, task.id);

	Ext.apply(me, {
	    title: gettext('Task') + ': ' + descr,
	    width: 300,
	    layout: 'auto',
	    modal: true,
	    bodyPadding: 5,
	    items: pbar,
	    buttons: [
		{
		    text: gettext('Details'),
		    handler: function() {
			var win = Ext.create('Proxmox.window.TaskViewer', {
			    taskDone: me.taskDone,
			    upid: me.upid
			});
			win.show();
			me.close();
		    }
		}
	    ]
	});

	me.callParent();

	statstore.startUpdate();

	pbar.wait();
    }
});

// fixme: how can we avoid those lint errors?
/*jslint confusion: true */

Ext.define('Proxmox.window.TaskViewer', {
    extend: 'Ext.window.Window',
    alias: 'widget.proxmoxTaskViewer',

    extraTitle: '', // string to prepend after the generic task title

    taskDone: Ext.emptyFn,

    initComponent: function() {
        var me = this;

	if (!me.upid) {
	    throw "no task specified";
	}

	var task = Proxmox.Utils.parse_task_upid(me.upid);

	var statgrid;

	var rows = {
	    status: {
		header: gettext('Status'),
		defaultValue: 'unknown',
		renderer: function(value) {
		    if (value != 'stopped') {
			return value;
		    }
		    var es = statgrid.getObjectValue('exitstatus');
		    if (es) {
			return value + ': ' + es;
		    }
		}
	    },
	    exitstatus: {
		visible: false
	    },
	    type: {
		header: gettext('Task type'),
		required: true
	    },
	    user: {
		header: gettext('User name'),
		required: true
	    },
	    node: {
		header: gettext('Node'),
		required: true
	    },
	    pid: {
		header: gettext('Process ID'),
		required: true
	    },
	    starttime: {
		header: gettext('Start Time'),
		required: true,
		renderer: Proxmox.Utils.render_timestamp
	    },
	    upid: {
		header: gettext('Unique task ID')
	    }
	};

	var statstore = Ext.create('Proxmox.data.ObjectStore', {
            url: "/api2/json/nodes/" + task.node + "/tasks/" + me.upid + "/status",
	    interval: 1000,
	    rows: rows
	});

	me.on('destroy', statstore.stopUpdate);

	var stop_task = function() {
	    Proxmox.Utils.API2Request({
		url: "/nodes/" + task.node + "/tasks/" + me.upid,
		waitMsgTarget: me,
		method: 'DELETE',
		failure: function(response, opts) {
		    Ext.Msg.alert(gettext('Error'), response.htmlStatus);
		}
	    });
	};

	var stop_btn1 = new Ext.Button({
	    text: gettext('Stop'),
	    disabled: true,
	    handler: stop_task
	});

	var stop_btn2 = new Ext.Button({
	    text: gettext('Stop'),
	    disabled: true,
	    handler: stop_task
	});

	statgrid = Ext.create('Proxmox.grid.ObjectGrid', {
	    title: gettext('Status'),
	    layout: 'fit',
	    tbar: [ stop_btn1 ],
	    rstore: statstore,
	    rows: rows,
	    border: false
	});

	var logView = Ext.create('Proxmox.panel.LogView', {
	    title: gettext('Output'),
	    tbar: [ stop_btn2 ],
	    border: false,
	    url: "/api2/extjs/nodes/" + task.node + "/tasks/" + me.upid + "/log"
	});

	me.mon(statstore, 'load', function() {
	    var status = statgrid.getObjectValue('status');

	    if (status === 'stopped') {
		logView.scrollToEnd = false;
		logView.requestUpdate();
		statstore.stopUpdate();
		me.taskDone(statgrid.getObjectValue('exitstatus') == 'OK');
	    }

	    stop_btn1.setDisabled(status !== 'running');
	    stop_btn2.setDisabled(status !== 'running');
	});

	statstore.startUpdate();

	Ext.apply(me, {
	    title: "Task viewer: " + task.desc + me.extraTitle,
	    width: 800,
	    height: 400,
	    layout: 'fit',
	    modal: true,
	    items: [{
		xtype: 'tabpanel',
		region: 'center',
		items: [ logView, statgrid ]
	    }]
        });

	me.callParent();

	logView.fireEvent('show', logView);
    }
});

Ext.define('apt-pkglist', {
    extend: 'Ext.data.Model',
    fields: [ 'Package', 'Title', 'Description', 'Section', 'Arch',
	      'Priority', 'Version', 'OldVersion', 'ChangeLogUrl', 'Origin' ],
    idProperty: 'Package'
});

Ext.define('Proxmox.node.APT', {
    extend: 'Ext.grid.GridPanel',

    xtype: 'proxmoxNodeAPT',

    upgradeBtn: undefined,

    columns: [
	{
	    header: gettext('Package'),
	    width: 200,
	    sortable: true,
	    dataIndex: 'Package'
	},
	{
	    text: gettext('Version'),
	    columns: [
		{
		    header: gettext('current'),
		    width: 100,
		    sortable: false,
		    dataIndex: 'OldVersion'
		},
		{
		    header: gettext('new'),
		    width: 100,
		    sortable: false,
		    dataIndex: 'Version'
		}
	    ]
	},
	{
	    header: gettext('Description'),
	    sortable: false,
	    dataIndex: 'Title',
	    flex: 1
	}
    ],

    initComponent : function() {
	var me = this;

	if (!me.nodename) {
	    throw "no node name specified";
	}

	var store = Ext.create('Ext.data.Store', {
	    model: 'apt-pkglist',
	    groupField: 'Origin',
	    proxy: {
		type: 'proxmox',
		url: "/api2/json/nodes/" + me.nodename + "/apt/update"
	    },
	    sorters: [
		{
		    property : 'Package',
		    direction: 'ASC'
		}
	    ]
	});

	var groupingFeature = Ext.create('Ext.grid.feature.Grouping', {
            groupHeaderTpl: '{[ "Origin: " + values.name ]} ({rows.length} Item{[values.rows.length > 1 ? "s" : ""]})',
	    enableGroupingMenu: false
	});

	var rowBodyFeature = Ext.create('Ext.grid.feature.RowBody', {
            getAdditionalData: function (data, rowIndex, record, orig) {
		var headerCt = this.view.headerCt;
		var colspan = headerCt.getColumnCount();
		return {
		    rowBody: '<div style="padding: 1em">' +
			Ext.String.htmlEncode(data.Description) +
			'</div>',
		    rowBodyCls: me.full_description ? '' : Ext.baseCSSPrefix + 'grid-row-body-hidden',
		    rowBodyColspan: colspan
		};
	    }
	});

	var reload = function() {
	    store.load();
	};

	Proxmox.Utils.monStoreErrors(me, store, true);

	var apt_command = function(cmd){
	    Proxmox.Utils.API2Request({
		url: "/nodes/" + me.nodename + "/apt/" + cmd,
		method: 'POST',
		failure: function(response, opts) {
		    Ext.Msg.alert(gettext('Error'), response.htmlStatus);
		},
		success: function(response, opts) {
		    var upid = response.result.data;

		    var win = Ext.create('Proxmox.window.TaskViewer', {
			upid: upid
		    });
		    win.show();
		    me.mon(win, 'close', reload);
		}
	    });
	};

	var sm = Ext.create('Ext.selection.RowModel', {});

	var update_btn = new Ext.Button({
	    text: gettext('Refresh'),
	    handler: function() {
		Proxmox.Utils.checked_command(function() { apt_command('update'); });
	    }
	});

	var show_changelog = function(rec) {
	    if (!rec || !rec.data || !(rec.data.ChangeLogUrl && rec.data.Package)) {
		return;
	    }

	    var view = Ext.createWidget('component', {
		autoScroll: true,
		style: {
		    'background-color': 'white',
		    'white-space': 'pre',
		    'font-family': 'monospace',
		    padding: '5px'
		}
	    });

	    var win = Ext.create('Ext.window.Window', {
		title: gettext('Changelog') + ": " + rec.data.Package,
		width: 800,
		height: 400,
		layout: 'fit',
		modal: true,
		items: [ view ]
	    });

	    Proxmox.Utils.API2Request({
		waitMsgTarget: me,
		url: "/nodes/" + me.nodename + "/apt/changelog",
		params: {
		    name: rec.data.Package,
		    version: rec.data.Version
		},
		method: 'GET',
		failure: function(response, opts) {
		    win.close();
		    Ext.Msg.alert(gettext('Error'), response.htmlStatus);
		},
		success: function(response, opts) {
		    win.show();
		    view.update(Ext.htmlEncode(response.result.data));
		}
	    });

	};

	var changelog_btn = new Proxmox.button.Button({
	    text: gettext('Changelog'),
	    selModel: sm,
	    disabled: true,
	    enableFn: function(rec) {
		if (!rec || !rec.data || !(rec.data.ChangeLogUrl && rec.data.Package)) {
		    return false;
		}
		return true;
	    },
	    handler: function(b, e, rec) {
		show_changelog(rec);
	    }
	});

	var verbose_desc_checkbox = new Ext.form.field.Checkbox({
	    boxLabel: gettext('Show details'),
	    value: false,
	    listeners: {
		change: (f, val) => {
		    me.full_description = val;
		    me.getView().refresh();
		}
	    }
	});

	if (me.upgradeBtn) {
	    me.tbar =  [ update_btn, me.upgradeBtn, changelog_btn, '->', verbose_desc_checkbox ];
	} else {
	    me.tbar =  [ update_btn, changelog_btn, '->', verbose_desc_checkbox ];
	}

	Ext.apply(me, {
	    store: store,
	    stateful: true,
	    stateId: 'grid-update',
	    selModel: sm,
            viewConfig: {
		stripeRows: false,
		emptyText: '<div style="display:table; width:100%; height:100%;"><div style="display:table-cell; vertical-align: middle; text-align:center;"><b>' + gettext('No updates available.') + '</div></div>'
	    },
	    features: [ groupingFeature, rowBodyFeature ],
	    listeners: {
		activate: reload,
		itemdblclick: function(v, rec) {
		    show_changelog(rec);
		}
	    }
	});

	me.callParent();
    }
});
Ext.define('Proxmox.node.NetworkEdit', {
    extend: 'Proxmox.window.Edit',
    alias: ['widget.proxmoxNodeNetworkEdit'],

    initComponent : function() {
	var me = this;

	if (!me.nodename) {
	    throw "no node name specified";
	}

	if (!me.iftype) {
	    throw "no network device type specified";
	}

	me.isCreate = !me.iface;

	var iface_vtype;

	if (me.iftype === 'bridge') {
	    iface_vtype = 'BridgeName';
	} else if (me.iftype === 'bond') {
	    iface_vtype = 'BondName';
	} else if (me.iftype === 'eth' && !me.isCreate) {
	    iface_vtype = 'InterfaceName';
	} else if (me.iftype === 'vlan' && !me.isCreate) {
	    iface_vtype = 'InterfaceName';
	} else if (me.iftype === 'OVSBridge') {
	    iface_vtype = 'BridgeName';
	} else if (me.iftype === 'OVSBond') {
	    iface_vtype = 'BondName';
	} else if (me.iftype === 'OVSIntPort') {
	    iface_vtype = 'InterfaceName';
	} else if (me.iftype === 'OVSPort') {
	    iface_vtype = 'InterfaceName';
	} else {
	    console.log(me.iftype);
	    throw "unknown network device type specified";
	}

	me.subject = Proxmox.Utils.render_network_iface_type(me.iftype);

	var column2 = [];

	if (!(me.iftype === 'OVSIntPort' || me.iftype === 'OVSPort' ||
	      me.iftype === 'OVSBond')) {
	    column2.push({
		xtype: 'proxmoxcheckbox',
		fieldLabel: gettext('Autostart'),
		name: 'autostart',
		uncheckedValue: 0,
		checked: me.isCreate ? true : undefined
	    });
	}

	if (me.iftype === 'bridge') {
	    column2.push({
		xtype: 'proxmoxcheckbox',
		fieldLabel: gettext('VLAN aware'),
		name: 'bridge_vlan_aware',
		deleteEmpty: !me.isCreate
	    });
	    column2.push({
		xtype: 'textfield',
		fieldLabel: gettext('Bridge ports'),
		name: 'bridge_ports'
	    });
	} else if (me.iftype === 'OVSBridge') {
	    column2.push({
		xtype: 'textfield',
		fieldLabel: gettext('Bridge ports'),
		name: 'ovs_ports'
	    });
	    column2.push({
		xtype: 'textfield',
		fieldLabel: gettext('OVS options'),
		name: 'ovs_options'
	    });
	} else if (me.iftype === 'OVSPort' || me.iftype === 'OVSIntPort') {
	    column2.push({
		xtype: me.isCreate ? 'PVE.form.BridgeSelector' : 'displayfield',
		fieldLabel: Proxmox.Utils.render_network_iface_type('OVSBridge'),
		allowBlank: false,
		nodename: me.nodename,
		bridgeType: 'OVSBridge',
		name: 'ovs_bridge'
	    });
	    column2.push({
		xtype: 'pveVlanField',
		deleteEmpty: !me.isCreate,
		name: 'ovs_tag',
		value: ''
	    });
	    column2.push({
		xtype: 'textfield',
		fieldLabel: gettext('OVS options'),
		name: 'ovs_options'
	    });
	} else if (me.iftype === 'bond') {
	    column2.push({
		xtype: 'textfield',
		fieldLabel: gettext('Slaves'),
		name: 'slaves'
	    });

	    var policySelector = Ext.createWidget('bondPolicySelector', {
		fieldLabel: gettext('Hash policy'),
		name: 'bond_xmit_hash_policy',
		deleteEmpty: !me.isCreate,
		disabled: true
	    });

	    column2.push({
		xtype: 'bondModeSelector',
		fieldLabel: gettext('Mode'),
		name: 'bond_mode',
		value: me.isCreate ? 'balance-rr' : undefined,
		listeners: {
		    change: function(f, value) {
			if (value === 'balance-xor' ||
			    value === '802.3ad') {
			    policySelector.setDisabled(false);
			} else {
			    policySelector.setDisabled(true);
			    policySelector.setValue('');
			}
		    }
		},
		allowBlank: false
	    });

	    column2.push(policySelector);

	} else if (me.iftype === 'OVSBond') {
	    column2.push({
		xtype: me.isCreate ? 'PVE.form.BridgeSelector' : 'displayfield',
		fieldLabel: Proxmox.Utils.render_network_iface_type('OVSBridge'),
		allowBlank: false,
		nodename: me.nodename,
		bridgeType: 'OVSBridge',
		name: 'ovs_bridge'
	    });
	    column2.push({
		xtype: 'pveVlanField',
		deleteEmpty: !me.isCreate,
		name: 'ovs_tag',
		value: ''
	    });
	    column2.push({
		xtype: 'textfield',
		fieldLabel: gettext('OVS options'),
		name: 'ovs_options'
	    });
	}

	column2.push({
	    xtype: 'textfield',
	    fieldLabel: gettext('Comment'),
	    allowBlank: true,
	    nodename: me.nodename,
	    name: 'comments'
	});

	var url;
	var method;

	if (me.isCreate) {
	    url = "/api2/extjs/nodes/" + me.nodename + "/network";
	    method = 'POST';
	} else {
	    url = "/api2/extjs/nodes/" + me.nodename + "/network/" + me.iface;
	    method = 'PUT';
	}

	var column1 = [
	    {
		xtype: 'hiddenfield',
		name: 'type',
		value: me.iftype
	    },
	    {
		xtype: me.isCreate ? 'textfield' : 'displayfield',
		fieldLabel: gettext('Name'),
		name: 'iface',
		value: me.iface,
		vtype: iface_vtype,
		allowBlank: false
	    }
	];

	if (me.iftype === 'OVSBond') {
	    column1.push(
		{
		    xtype: 'bondModeSelector',
		    fieldLabel: gettext('Mode'),
		    name: 'bond_mode',
		    openvswitch: true,
		    value: me.isCreate ? 'active-backup' : undefined,
		    allowBlank: false
		},
		{
		    xtype: 'textfield',
		    fieldLabel: gettext('Slaves'),
		    name: 'ovs_bonds'
		}
	    );
	} else {

	    column1.push(
		{
		    xtype: 'proxmoxtextfield',
		    deleteEmpty: !me.isCreate,
		    fieldLabel: 'IPv4/CIDR',
		    vtype: 'IPCIDRAddress',
		    name: 'cidr'
		},
		{
		    xtype: 'proxmoxtextfield',
		    deleteEmpty: !me.isCreate,
		    fieldLabel: gettext('Gateway') + ' (IPv4)',
		    vtype: 'IPAddress',
		    name: 'gateway'
		},
		{
		    xtype: 'proxmoxtextfield',
		    deleteEmpty: !me.isCreate,
		    fieldLabel: 'IPv6/CIDR',
		    vtype: 'IP6CIDRAddress',
		    name: 'cidr6'
		},
		{
		    xtype: 'proxmoxtextfield',
		    deleteEmpty: !me.isCreate,
		    fieldLabel: gettext('Gateway') + ' (IPv6)',
		    vtype: 'IP6Address',
		    name: 'gateway6'
		}
	    );
	}

	Ext.applyIf(me, {
	    url: url,
	    method: method,
	    items: {
                xtype: 'inputpanel',
		column1: column1,
		column2: column2
	    }
	});

	me.callParent();

	if (me.isCreate) {
	    me.down('field[name=iface]').setValue(me.iface_default);
	} else {
	    me.load({
		success: function(response, options) {
		    var data = response.result.data;
		    if (data.type !== me.iftype) {
			var msg = "Got unexpected device type";
			Ext.Msg.alert(gettext('Error'), msg, function() {
			    me.close();
			});
			return;
		    }
		    me.setValues(data);
		    me.isValid(); // trigger validation
		}
	    });
	}
    }
});
Ext.define('proxmox-networks', {
    extend: 'Ext.data.Model',
    fields: [
	'iface', 'type', 'active', 'autostart',
	'bridge_ports', 'slaves',
	'address', 'netmask', 'gateway',
	'address6', 'netmask6', 'gateway6',
	'cidr', 'cidr6',
	'comments'
    ],
    idProperty: 'iface'
});

Ext.define('Proxmox.node.NetworkView', {
    extend: 'Ext.panel.Panel',

    alias: ['widget.proxmoxNodeNetworkView'],

    // defines what types of network devices we want to create
    // order is always the same
    types: ['bridge', 'bond', 'ovs'],

    showApplyBtn: false,

    initComponent : function() {
	var me = this;

	if (!me.nodename) {
	    throw "no node name specified";
	}

	var baseUrl = '/nodes/' + me.nodename + '/network';

	var store = Ext.create('Ext.data.Store', {
	    model: 'proxmox-networks',
	    proxy: {
                type: 'proxmox',
                url: '/api2/json' + baseUrl
	    },
	    sorters: [
		{
		    property : 'iface',
		    direction: 'ASC'
		}
	    ]
	});

	var reload = function() {
	    var changeitem = me.down('#changes');
	    var apply_btn = me.down('#apply');
	    var revert_btn = me.down('#revert');
	    Proxmox.Utils.API2Request({
		url: baseUrl,
		failure: function(response, opts) {
		    store.loadData({});
		    Proxmox.Utils.setErrorMask(me, response.htmlStatus);
		    changeitem.update('');
		    changeitem.setHidden(true);
		},
		success: function(response, opts) {
		    var result = Ext.decode(response.responseText);
		    store.loadData(result.data);
		    var changes = result.changes;
		    if (changes === undefined || changes === '') {
			changes = gettext("No changes");
			changeitem.setHidden(true);
			apply_btn.setDisabled(true);
			revert_btn.setDisabled(true);
		    } else {
			changeitem.update("<pre>" + Ext.htmlEncode(changes) + "</pre>");
			changeitem.setHidden(false);
			apply_btn.setDisabled(false);
			revert_btn.setDisabled(false);
		    }
		}
	    });
	};

	var run_editor = function() {
	    var grid = me.down('gridpanel');
	    var sm = grid.getSelectionModel();
	    var rec = sm.getSelection()[0];
	    if (!rec) {
		return;
	    }

	    var win = Ext.create('Proxmox.node.NetworkEdit', {
		nodename: me.nodename,
		iface: rec.data.iface,
		iftype: rec.data.type
	    });
	    win.show();
	    win.on('destroy', reload);
	};

	var edit_btn = new Ext.Button({
	    text: gettext('Edit'),
	    disabled: true,
	    handler: run_editor
	});

	var del_btn = new Ext.Button({
	    text: gettext('Remove'),
	    disabled: true,
	    handler: function(){
		var grid = me.down('gridpanel');
		var sm = grid.getSelectionModel();
		var rec = sm.getSelection()[0];
		if (!rec) {
		    return;
		}

		var iface = rec.data.iface;

		Proxmox.Utils.API2Request({
		    url: baseUrl + '/' + iface,
		    method: 'DELETE',
		    waitMsgTarget: me,
		    callback: function() {
			reload();
		    },
		    failure: function(response, opts) {
			Ext.Msg.alert(gettext('Error'), response.htmlStatus);
		    }
		});
	    }
	});

	var apply_btn = Ext.create('Proxmox.button.Button', {
	    text: gettext('Apply Configuration'),
	    itemId: 'apply',
	    disabled: true,
	    confirmMsg: 'Do you want to apply pending network changes?',
	    hidden: !me.showApplyBtn,
	    handler: function() {
		Proxmox.Utils.API2Request({
		    url: baseUrl,
		    method: 'PUT',
		    waitMsgTarget: me,
		    success: function(response, opts) {
			var upid = response.result.data;

			var win = Ext.create('Proxmox.window.TaskProgress', {
			    taskDone: reload,
			    upid: upid
			});
			win.show();
		    },
		    failure: function(response, opts) {
			Ext.Msg.alert(gettext('Error'), response.htmlStatus);
		    }
		});
	    }
	});

	var set_button_status = function() {
	    var grid = me.down('gridpanel');
	    var sm = grid.getSelectionModel();
	    var rec = sm.getSelection()[0];

	    edit_btn.setDisabled(!rec);
	    del_btn.setDisabled(!rec);
	};

	var render_ports = function(value, metaData, record) {
	    if (value === 'bridge') {
		return record.data.bridge_ports;
	    } else if (value === 'bond') {
		return record.data.slaves;
	    } else if (value === 'OVSBridge') {
		return record.data.ovs_ports;
	    } else if (value === 'OVSBond') {
		return record.data.ovs_bonds;
	    }
	};

	var find_next_iface_id = function(prefix) {
	    var next;
	    for (next = 0; next <= 9999; next++) {
		if (!store.getById(prefix + next.toString())) {
		    break;
		}
	    }
	    return prefix + next.toString();
	};

	var menu_items = [];

	if (me.types.indexOf('bridge') !== -1) {
	    menu_items.push({
		text: Proxmox.Utils.render_network_iface_type('bridge'),
		handler: function() {
		    var win = Ext.create('Proxmox.node.NetworkEdit', {
			nodename: me.nodename,
			iftype: 'bridge',
			iface_default: find_next_iface_id('vmbr')
		    });
		    win.on('destroy', reload);
		    win.show();
		}
	    });
	}

	if (me.types.indexOf('bond') !== -1) {
	    menu_items.push({
		text: Proxmox.Utils.render_network_iface_type('bond'),
		handler: function() {
		    var win = Ext.create('Proxmox.node.NetworkEdit', {
			nodename: me.nodename,
			iftype: 'bond',
			iface_default: find_next_iface_id('bond')
		    });
		    win.on('destroy', reload);
		    win.show();
		}
	    });
	}

	if (me.types.indexOf('ovs') !== -1) {
	    if (menu_items.length > 0) {
		menu_items.push({ xtype: 'menuseparator' });
	    }

	    menu_items.push(
		{
		    text: Proxmox.Utils.render_network_iface_type('OVSBridge'),
		    handler: function() {
			var win = Ext.create('Proxmox.node.NetworkEdit', {
			    nodename: me.nodename,
			    iftype: 'OVSBridge',
			    iface_default: find_next_iface_id('vmbr')
			});
			win.on('destroy', reload);
			win.show();
		    }
		},
		{
		    text: Proxmox.Utils.render_network_iface_type('OVSBond'),
		    handler: function() {
			var win = Ext.create('Proxmox.node.NetworkEdit', {
			    nodename: me.nodename,
			    iftype: 'OVSBond',
			    iface_default: find_next_iface_id('bond')
			});
			win.on('destroy', reload);
			win.show();
		    }
		},
		{
		    text: Proxmox.Utils.render_network_iface_type('OVSIntPort'),
		    handler: function() {
			var win = Ext.create('Proxmox.node.NetworkEdit', {
			    nodename: me.nodename,
			    iftype: 'OVSIntPort'
			});
			win.on('destroy', reload);
			win.show();
		    }
		}
	    );
	}

	var renderer_generator = function(fieldname) {
	    return function(val, metaData, rec) {
		var tmp = [];
		if (rec.data[fieldname]) {
		    tmp.push(rec.data[fieldname]);
		}
		if (rec.data[fieldname + '6']) {
		    tmp.push(rec.data[fieldname + '6']);
		}
		return tmp.join('<br>') || '';
	    };
	};

	Ext.apply(me, {
	    layout: 'border',
	    tbar: [
		{
		    text: gettext('Create'),
		    menu: {
			plain: true,
			items: menu_items
		    }
		}, '-',
		{
		    text: gettext('Revert'),
		    itemId: 'revert',
		    handler: function() {
			Proxmox.Utils.API2Request({
			    url: baseUrl,
			    method: 'DELETE',
			    waitMsgTarget: me,
			    callback: function() {
				reload();
			    },
			    failure: function(response, opts) {
				Ext.Msg.alert(gettext('Error'), response.htmlStatus);
			    }
			});
		    }
		},
		edit_btn,
		del_btn,
		'-',
		apply_btn
	    ],
	    items: [
		{
		    xtype: 'gridpanel',
		    stateful: true,
		    stateId: 'grid-node-network',
		    store: store,
		    region: 'center',
		    border: false,
		    columns: [
			{
			    header: gettext('Name'),
			    sortable: true,
			    dataIndex: 'iface'
			},
			{
			    header: gettext('Type'),
			    sortable: true,
			    width: 120,
			    renderer: Proxmox.Utils.render_network_iface_type,
			    dataIndex: 'type'
			},
			{
			    xtype: 'booleancolumn',
			    header: gettext('Active'),
			    width: 80,
			    sortable: true,
			    dataIndex: 'active',
			    trueText: Proxmox.Utils.yesText,
			    falseText: Proxmox.Utils.noText,
			    undefinedText: Proxmox.Utils.noText,
			},
			{
			    xtype: 'booleancolumn',
			    header: gettext('Autostart'),
			    width: 80,
			    sortable: true,
			    dataIndex: 'autostart',
			    trueText: Proxmox.Utils.yesText,
			    falseText: Proxmox.Utils.noText,
			    undefinedText: Proxmox.Utils.noText
			},
			{
			    xtype: 'booleancolumn',
			    header: gettext('VLAN aware'),
			    width: 80,
			    sortable: true,
			    dataIndex: 'bridge_vlan_aware',
			    trueText: Proxmox.Utils.yesText,
			    falseText: Proxmox.Utils.noText,
			    undefinedText: Proxmox.Utils.noText
			},
			{
			    header: gettext('Ports/Slaves'),
			    dataIndex: 'type',
			    renderer: render_ports
			},
			{
			    header: gettext('Bond Mode'),
			    dataIndex: 'bond_mode',
			    renderer: Proxmox.Utils.render_bond_mode,
			},
			{
			    header: gettext('Hash Policy'),
			    hidden: true,
			    dataIndex: 'bond_xmit_hash_policy',
			},
			{
			    header: gettext('IP address'),
			    sortable: true,
			    width: 120,
			    hidden: true,
			    dataIndex: 'address',
			    renderer: renderer_generator('address'),
			},
			{
			    header: gettext('Subnet mask'),
			    width: 120,
			    sortable: true,
			    hidden: true,
			    dataIndex: 'netmask',
			    renderer: renderer_generator('netmask'),
			},
			{
			    header: gettext('CIDR'),
			    width: 120,
			    sortable: true,
			    dataIndex: 'cidr',
			    renderer: renderer_generator('cidr'),
			},
			{
			    header: gettext('Gateway'),
			    width: 120,
			    sortable: true,
			    dataIndex: 'gateway',
			    renderer: renderer_generator('gateway'),
			},
			{
			    header: gettext('Comment'),
			    dataIndex: 'comments',
			    flex: 1,
			    renderer: Ext.String.htmlEncode
			}
		    ],
		    listeners: {
			selectionchange: set_button_status,
			itemdblclick: run_editor
		    }
		},
		{
		    border: false,
		    region: 'south',
		    autoScroll: true,
		    hidden: true,
		    itemId: 'changes',
		    tbar: [
			gettext('Pending changes') + ' (' +
			    gettext("Either reboot or use 'Apply Configuration' (needs ifupdown2) to activate") + ')'
		    ],
		    split: true,
		    bodyPadding: 5,
		    flex: 0.6,
		    html: gettext("No changes")
		}
	    ],
	});

	me.callParent();
	reload();
    }
});
Ext.define('Proxmox.node.DNSEdit', {
    extend: 'Proxmox.window.Edit',
    alias: ['widget.proxmoxNodeDNSEdit'],

    initComponent : function() {
	var me = this;

	if (!me.nodename) {
	    throw "no node name specified";
	}

	me.items = [
	    {
		xtype: 'textfield',
                fieldLabel: gettext('Search domain'),
                name: 'search',
                allowBlank: false
	    },
	    {
		xtype: 'proxmoxtextfield',
                fieldLabel: gettext('DNS server') + " 1",
		vtype: 'IP64Address',
		skipEmptyText: true,
                name: 'dns1'
	    },
	    {
		xtype: 'proxmoxtextfield',
		fieldLabel: gettext('DNS server') + " 2",
		vtype: 'IP64Address',
		skipEmptyText: true,
                name: 'dns2'
	    },
	    {
		xtype: 'proxmoxtextfield',
                fieldLabel: gettext('DNS server') + " 3",
		vtype: 'IP64Address',
		skipEmptyText: true,
                name: 'dns3'
	    }
	];

	Ext.applyIf(me, {
	    subject: gettext('DNS'),
	    url: "/api2/extjs/nodes/" + me.nodename + "/dns",
	    fieldDefaults: {
		labelWidth: 120
	    }
	});

	me.callParent();

	me.load();
    }
});
Ext.define('Proxmox.node.HostsView', {
    extend: 'Ext.panel.Panel',
    xtype: 'proxmoxNodeHostsView',

    reload: function() {
	var me = this;
	me.store.load();
    },

    tbar: [
	{
	    text: gettext('Save'),
	    disabled: true,
	    itemId: 'savebtn',
	    handler: function() {
		var me = this.up('panel');
		Proxmox.Utils.API2Request({
		    params: {
			digest: me.digest,
			data: me.down('#hostsfield').getValue()
		    },
		    method: 'POST',
		    url: '/nodes/' + me.nodename + '/hosts',
		    waitMsgTarget: me,
		    success: function(response, opts) {
			me.reload();
		    },
		    failure: function(response, opts) {
			Ext.Msg.alert('Error', response.htmlStatus);
		    }
		});
	    }
	},
	{
	    text: gettext('Revert'),
	    disabled: true,
	    itemId: 'resetbtn',
	    handler: function() {
		var me = this.up('panel');
		me.down('#hostsfield').reset();
	    }
	}
    ],

	    layout: 'fit',

    items: [
	{
	    xtype: 'textarea',
	    itemId: 'hostsfield',
	    fieldStyle: {
		'font-family': 'monospace',
		'white-space': 'pre'
	    },
	    listeners: {
		dirtychange: function(ta, dirty) {
		    var me = this.up('panel');
		    me.down('#savebtn').setDisabled(!dirty);
		    me.down('#resetbtn').setDisabled(!dirty);
		}
	    }
	}
    ],

    initComponent : function() {
	var me = this;

	if (!me.nodename) {
	    throw "no node name specified";
	}

	me.store = Ext.create('Ext.data.Store', {
	    proxy: {
		type: 'proxmox',
		url: "/api2/json/nodes/" + me.nodename + "/hosts",
	    }
	});

	me.callParent();

	Proxmox.Utils.monStoreErrors(me, me.store);

	me.mon(me.store, 'load', function(store, records, success) {
	    if (!success || records.length < 1) {
		return;
	    }
	    me.digest = records[0].data.digest;
	    var data = records[0].data.data;
	    me.down('#hostsfield').setValue(data);
	    me.down('#hostsfield').resetOriginalValue();
	});

	me.reload();
    }
});
Ext.define('Proxmox.node.DNSView', {
    extend: 'Proxmox.grid.ObjectGrid',
    alias: ['widget.proxmoxNodeDNSView'],

    initComponent : function() {
	var me = this;

	if (!me.nodename) {
	    throw "no node name specified";
	}

	var run_editor = function() {
	    var win = Ext.create('Proxmox.node.DNSEdit', {
		nodename: me.nodename
	    });
	    win.show();
	};

	Ext.apply(me, {
	    url: "/api2/json/nodes/" + me.nodename + "/dns",
	    cwidth1: 130,
	    interval: 1000,
	    run_editor: run_editor,
	    rows: {
		search: {
		    header: 'Search domain',
		    required: true,
		    renderer: Ext.htmlEncode
		},
		dns1: {
		    header: gettext('DNS server') + " 1",
		    required: true,
		    renderer: Ext.htmlEncode
		},
		dns2: {
		    header: gettext('DNS server') + " 2",
		    renderer: Ext.htmlEncode
		},
		dns3: {
		    header: gettext('DNS server') + " 3",
		    renderer: Ext.htmlEncode
		}
	    },
	    tbar: [
		{
		    text: gettext("Edit"),
		    handler: run_editor
		}
	    ],
	    listeners: {
		itemdblclick: run_editor
	    }
	});

	me.callParent();

	me.on('activate', me.rstore.startUpdate);
	me.on('deactivate', me.rstore.stopUpdate);
	me.on('destroy', me.rstore.stopUpdate);
    }
});
Ext.define('Proxmox.node.Tasks', {
    extend: 'Ext.grid.GridPanel',

    alias: ['widget.proxmoxNodeTasks'],
    stateful: true,
    stateId: 'grid-node-tasks',
    loadMask: true,
    sortableColumns: false,
    vmidFilter: 0,

    initComponent : function() {
	var me = this;

	if (!me.nodename) {
	    throw "no node name specified";
	}

	var store = Ext.create('Ext.data.BufferedStore', {
	    pageSize: 500,
	    autoLoad: true,
	    remoteFilter: true,
	    model: 'proxmox-tasks',
	    proxy: {
                type: 'proxmox',
		startParam: 'start',
		limitParam: 'limit',
                url: "/api2/json/nodes/" + me.nodename + "/tasks"
	    }
	});

	var userfilter = '';
	var filter_errors = 0;

	var updateProxyParams = function() {
	    var params = {
		errors: filter_errors
	    };
	    if (userfilter) {
		params.userfilter = userfilter;
	    }
	    if (me.vmidFilter) {
		params.vmid = me.vmidFilter;
	    }
	    store.proxy.extraParams = params;
	};

	updateProxyParams();

	var reload_task = Ext.create('Ext.util.DelayedTask',function() {
	    updateProxyParams();
	    store.reload();
	});

	var run_task_viewer = function() {
	    var sm = me.getSelectionModel();
	    var rec = sm.getSelection()[0];
	    if (!rec) {
		return;
	    }

	    var win = Ext.create('Proxmox.window.TaskViewer', {
		upid: rec.data.upid
	    });
	    win.show();
	};

	var view_btn = new Ext.Button({
	    text: gettext('View'),
	    disabled: true,
	    handler: run_task_viewer
	});

	Proxmox.Utils.monStoreErrors(me, store, true);

	Ext.apply(me, {
	    store: store,
	    viewConfig: {
		trackOver: false,
		stripeRows: false, // does not work with getRowClass()

		getRowClass: function(record, index) {
		    var status = record.get('status');

		    if (status && status != 'OK') {
			return "proxmox-invalid-row";
		    }
		}
	    },
	    tbar: [
		view_btn, '->', gettext('User name') +':', ' ',
		{
		    xtype: 'textfield',
		    width: 200,
		    value: userfilter,
		    enableKeyEvents: true,
		    listeners: {
			keyup: function(field, e) {
			    userfilter = field.getValue();
			    reload_task.delay(500);
			}
		    }
		}, ' ', gettext('Only Errors') + ':', ' ',
		{
		    xtype: 'checkbox',
		    hideLabel: true,
		    checked: filter_errors,
		    listeners: {
			change: function(field, checked) {
			    filter_errors = checked ? 1 : 0;
			    reload_task.delay(10);
			}
		    }
		}, ' '
	    ],
	    columns: [
		{
		    header: gettext("Start Time"),
		    dataIndex: 'starttime',
		    width: 100,
		    renderer: function(value) {
			return Ext.Date.format(value, "M d H:i:s");
		    }
		},
		{
		    header: gettext("End Time"),
		    dataIndex: 'endtime',
		    width: 100,
		    renderer: function(value, metaData, record) {
			return Ext.Date.format(value,"M d H:i:s");
		    }
		},
		{
		    header: gettext("Node"),
		    dataIndex: 'node',
		    width: 100
		},
		{
		    header: gettext("User name"),
		    dataIndex: 'user',
		    width: 150
		},
		{
		    header: gettext("Description"),
		    dataIndex: 'upid',
		    flex: 1,
		    renderer: Proxmox.Utils.render_upid
		},
		{
		    header: gettext("Status"),
		    dataIndex: 'status',
		    width: 200,
		    renderer: function(value, metaData, record) {
			if (value == 'OK') {
			    return 'OK';
			}
			// metaData.attr = 'style="color:red;"';
			return "ERROR: " + value;
		    }
		}
	    ],
	    listeners: {
		itemdblclick: run_task_viewer,
		selectionchange: function(v, selections) {
		    view_btn.setDisabled(!(selections && selections[0]));
		},
		show: function() { reload_task.delay(10); },
		destroy: function() { reload_task.cancel(); }
	    }
	});

	me.callParent();

    }
});
Ext.define('proxmox-services', {
    extend: 'Ext.data.Model',
    fields: [ 'service', 'name', 'desc', 'state' ],
    idProperty: 'service'
});

Ext.define('Proxmox.node.ServiceView', {
    extend: 'Ext.grid.GridPanel',

    alias: ['widget.proxmoxNodeServiceView'],

    startOnlyServices: {},

    initComponent : function() {
	var me = this;

	if (!me.nodename) {
	    throw "no node name specified";
	}

	var rstore = Ext.create('Proxmox.data.UpdateStore', {
	    interval: 1000,
	    storeid: 'proxmox-services' + me.nodename,
	    model: 'proxmox-services',
	    proxy: {
                type: 'proxmox',
                url: "/api2/json/nodes/" + me.nodename + "/services"
	    }
	});

	var store = Ext.create('Proxmox.data.DiffStore', {
	    rstore: rstore,
	    sortAfterUpdate: true,
	    sorters: [
		{
		    property : 'name',
		    direction: 'ASC'
		}
	    ]
	});

	var view_service_log = function() {
	    var sm = me.getSelectionModel();
	    var rec = sm.getSelection()[0];
	    var win = Ext.create('Ext.window.Window', {
		title: gettext('Syslog') + ': ' + rec.data.service,
		modal: true,
		width: 800,
		height: 400,
		layout: 'fit',
		items: {
		    xtype: 'proxmoxLogView',
		    url: "/api2/extjs/nodes/" + me.nodename + "/syslog?service=" +
			rec.data.service,
		    log_select_timespan: 1
		}
	    });
	    win.show();
	};

	var service_cmd = function(cmd) {
	    var sm = me.getSelectionModel();
	    var rec = sm.getSelection()[0];
	    Proxmox.Utils.API2Request({
		url: "/nodes/" + me.nodename + "/services/" + rec.data.service + "/" + cmd,
		method: 'POST',
		failure: function(response, opts) {
		    Ext.Msg.alert(gettext('Error'), response.htmlStatus);
		    me.loading = true;
		},
		success: function(response, opts) {
		    rstore.startUpdate();
		    var upid = response.result.data;

		    var win = Ext.create('Proxmox.window.TaskProgress', {
			upid: upid
		    });
		    win.show();
		}
	    });
	};

	var start_btn = new Ext.Button({
	    text: gettext('Start'),
	    disabled: true,
	    handler: function(){
		service_cmd("start");
	    }
	});

	var stop_btn = new Ext.Button({
	    text: gettext('Stop'),
	    disabled: true,
	    handler: function(){
		service_cmd("stop");
	    }
	});

	var restart_btn = new Ext.Button({
	    text: gettext('Restart'),
	    disabled: true,
	    handler: function(){
		service_cmd("restart");
	    }
	});

	var syslog_btn = new Ext.Button({
	    text: gettext('Syslog'),
	    disabled: true,
	    handler: view_service_log
	});

	var set_button_status = function() {
	    var sm = me.getSelectionModel();
	    var rec = sm.getSelection()[0];

	    if (!rec) {
		start_btn.disable();
		stop_btn.disable();
		restart_btn.disable();
		syslog_btn.disable();
		return;
	    }
	    var service = rec.data.service;
	    var state = rec.data.state;

	    syslog_btn.enable();

	    if (me.startOnlyServices[service]) {
		if (state == 'running') {
		    start_btn.disable();
		    restart_btn.enable();
		} else {
		    start_btn.enable();
		    restart_btn.disable();
		}
		stop_btn.disable();
	    } else {
		if (state == 'running') {
		    start_btn.disable();
		    restart_btn.enable();
		    stop_btn.enable();
		} else {
		    start_btn.enable();
		    restart_btn.disable();
		    stop_btn.disable();
		}
	    }
	};

	me.mon(store, 'refresh', set_button_status);

	Proxmox.Utils.monStoreErrors(me, rstore);

	Ext.apply(me, {
	    store: store,
	    stateful: false,
	    tbar: [ start_btn, stop_btn, restart_btn, syslog_btn ],
	    columns: [
		{
		    header: gettext('Name'),
		    flex: 1,
		    sortable: true,
		    dataIndex: 'name'
		},
		{
		    header: gettext('Status'),
		    width: 100,
		    sortable: true,
		    dataIndex: 'state'
		},
		{
		    header: gettext('Description'),
		    renderer: Ext.String.htmlEncode,
		    dataIndex: 'desc',
		    flex: 2
		}
	    ],
	    listeners: {
		selectionchange: set_button_status,
		itemdblclick: view_service_log,
		activate: rstore.startUpdate,
		destroy: rstore.stopUpdate
	    }
	});

	me.callParent();
    }
});
Ext.define('Proxmox.node.TimeEdit', {
    extend: 'Proxmox.window.Edit',
    alias: ['widget.proxmoxNodeTimeEdit'],

    subject: gettext('Time zone'),

    width: 400,

    autoLoad: true,

    fieldDefaults: {
	labelWidth: 70
    },

    items: {
	xtype: 'combo',
	fieldLabel: gettext('Time zone'),
	name: 'timezone',
	queryMode: 'local',
	store: Ext.create('Proxmox.data.TimezoneStore'),
	displayField: 'zone',
	editable: true,
	anyMatch: true,
	forceSelection: true,
	allowBlank: false
    },

    initComponent : function() {
	var me = this;

	if (!me.nodename) {
	    throw "no node name specified";
	}
	me.url = "/api2/extjs/nodes/" + me.nodename + "/time";

	me.callParent();
    }
});
Ext.define('Proxmox.node.TimeView', {
    extend: 'Proxmox.grid.ObjectGrid',
    alias: ['widget.proxmoxNodeTimeView'],

    initComponent : function() {
	var me = this;

	if (!me.nodename) {
	    throw "no node name specified";
	}

	var tzoffset = (new Date()).getTimezoneOffset()*60000;
	var renderlocaltime = function(value) {
	    var servertime = new Date((value * 1000) + tzoffset);
	    return Ext.Date.format(servertime, 'Y-m-d H:i:s');
	};

	var run_editor = function() {
	    var win = Ext.create('Proxmox.node.TimeEdit', {
		nodename: me.nodename
	    });
	    win.show();
	};

	Ext.apply(me, {
	    url: "/api2/json/nodes/" + me.nodename + "/time",
	    cwidth1: 150,
	    interval: 1000,
	    run_editor: run_editor,
	    rows: {
		timezone: {
		    header: gettext('Time zone'),
		    required: true
		},
		localtime: {
		    header: gettext('Server time'),
		    required: true,
		    renderer: renderlocaltime
		}
	    },
	    tbar: [
		{
		    text: gettext("Edit"),
		    handler: run_editor
		}
	    ],
	    listeners: {
		itemdblclick: run_editor
	    }
	});

	me.callParent();

	me.on('activate', me.rstore.startUpdate);
	me.on('deactivate', me.rstore.stopUpdate);
	me.on('destroy', me.rstore.stopUpdate);
    }
});
