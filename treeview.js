var domBuilder = require('dombuilder');

exports.TreeView = TreeView;
function TreeView() {
  domBuilder(["ul.treeview$el"], this);
}

TreeView.prototype.resize = function (width, height) {
  this.el.style.width = width + "px";
  this.el.style.height = height + "px";
};

TreeView.prototype.setRoot = function (entry) {
  this.el.textContent = "";
  this.el.appendChild(entry.el);
};

exports.Entry = Entry;
function Entry(name, title) {
  var self = this;
  var attribs = {onclick: function (evt) {
    return self.onClick(evt);
  }};
  if (title) { attribs.title = title; }
  domBuilder(["li$el",
    ["a.entry", attribs,
      ["i$icon", {"class": this.icon}], name
    ]
  ], this);
}

Entry.prototype.insert = function (index, child) {
  if (!this.children) {
    this.children = [];
    this.el.appendChild(domBuilder(["ul$container"], this));
  }
  if (index === this.children.length) {
    this.container.appendChild(child.el);
    this.children.push(child);
  }
  else {
    this.container.insertBefore(child.el, this.children[index].el);
    this.children.splice(index, 0, child);
  }
};

Entry.prototype.clear = function () {
  if (!this.children) return;
  this.children = null;
  this.el.removeChild(this.container);
  this.container = null;
};



/*

    function setup(config, imports, register) {
        var vfs = imports.vfs;
        var editor = imports.editor;
        var showHidden = false;
        var openFolders = {};
        var history = [];
        var cache = {};
        var selected;
        var index;

        function Entry(root, stat) {
            if (root[root.length - 1] === "/") {
                root = root.substr(0, root.length - 1);
            }
            this.stat = stat;
            this.path = root + "/" + stat.name;
            this.name = stat.name || "/";
        }

        Entry.prototype.render = function () {
            domBuilder(["li$el",
                ["a.entry$anchor", attribs,
                    ["i$icon", {onclick: this.onClickIcon.bind(this)}],
                    this.name
                ],
                ["ul.menu$menu"]
            ], this);
            this.update();
            return this;
        };

        Entry.prototype.update = function () {
            this.icon.setAttribute("class", "icon-file");
        };

        Entry.prototype.onClickIcon = function (evt) {
            evt.preventDefault();
            evt.stopPropagation();
            if (selected === this) {
                return this.hideMenu();
            }
            this.showMenu();
        };

        Entry.prototype.onClick = function (evt) {
            evt.preventDefault();
            evt.stopPropagation();
            this.openFile();
        };

        var isText = /(^text|javascript|json|candor|xml|x-sh)/;
        Entry.prototype.openFile = function () {
            if (this.stat.link) {
                alert("Can't open symlinks");
                return;
            }
            if (!isText.test(this.stat.mime)) {
                if (!confirm("Are you sure you want to open this file of type " + this.stat.mime + "?")) {
                    return;
                }
            }
            if (this.stat.size > 0x10000) {
                if (!confirm("Are you sure you want to open this file of size " + this.stat.size + " bytes?")) {
                    return;
                }
            }
            editor.openFile(this.path, this.stat);

        };

        Entry.prototype.getMenu = function () {
            var self = this;
            function onClick(evt) {
                evt.preventDefault();
                evt.stopPropagation();
                self.hideMenu();
            }
            return [
                ["li", {title: "Edit this file", onclick: function (evt) {
                    onClick(evt);
                    self.openFile();
                }}, ["i.icon-edit"]],
                ["li", {title: "Rename this file", onclick: function (evt) {
                    alert("TODO: Implement rename file");
                    onClick(evt);
                }}, ["i.icon-pencil"]],
                ["li", {title: "Delete this file", onclick: function (evt) {
                    alert("TODO: Implement delete file");
                    onClick(evt);
                }}, ["i.icon-trash"]],
                ["li", {title: "Create a new folder here", onclick: function (evt) {
                    alert("TODO: Implement new folder");
                    onClick(evt);
                }}, ["i.icon-folder-close"]],
                ["li", {title: "Create a new file here", onclick: function (evt) {
                    alert("TODO: Implement new file");
                    onClick(evt);
                }}, ["i.icon-file"]]
            ];
        };

        Entry.prototype.showMenu = function () {
            if (selected) {
                selected.hideMenu();
            }
            selected = this;
            this.anchor.setAttribute("class", "entry selected");
            this.menu.appendChild(domBuilder(this.getMenu()));
        };

        Entry.prototype.hideMenu = function () {
            if (selected === this) selected = null;
            this.anchor.setAttribute("class", "entry");
            this.menu.textContent = "";
        };

        function Folder(root, stat) {
            Entry.call(this, root, stat);
            this.state = "closed";
        }

        Folder.prototype = Object.create(Entry.prototype, {constructor: {value: Folder}});

        Folder.prototype.update = function () {
            var iconClass =
                this.state === "closed" ? "icon-folder-close" :
                this.state === "opened" ? "icon-folder-open" :
                    "icon-minus spin";
            this.icon.setAttribute("class", iconClass);
        };

        Folder.prototype.getMenu = function () {
            var self = this;
            function onClick(evt) {
                evt.preventDefault();
                evt.stopPropagation();
                self.hideMenu();
            }
            return [
                ["li", {title: "Make Root", onclick: function (evt) {
                    onClick(evt);
                    if (self.path === history[index]) {
                        return;
                    }
                    push(self.path);
                }}, ["i.icon-home"]],
                ["li", {title: "Rename this folder", onclick: function (evt) {
                    alert("TODO: Implement rename folder");
                    onClick(evt);
                }}, ["i.icon-pencil"]],
                ["li", {title: "Delete this folder", onclick: function (evt) {
                    alert("TODO: Implement delete folder");
                    onClick(evt);
                }}, ["i.icon-trash"]],
                ["li", {title: "Create a new folder here", onclick: function (evt) {
                    alert("TODO: Implement create folder");
                    onClick(evt);
                }}, ["i.icon-folder-close"]],
                ["li", {title: "Create a new file here", onclick: function (evt) {
                    alert("TODO: Implement create file");
                    onClick(evt);
                }}, ["i.icon-file"]]
            ];
        };


        Folder.prototype.onClick = function (evt) {
            evt.preventDefault();
            evt.stopPropagation();
            if (this.state === "loading") return;
            if (this.state === "closed") {
                return this.open();
            }
            return this.close();
        };

        Folder.prototype.open = function () {
            this.state = "loading";
            this.update();
            var self = this;
            self.el.appendChild(domBuilder(["ul$container"], self));

            var cached = cache[this.path];
            var options = {};
            if (cached) {
                options.etag = cached.etag;
            }

            var children = [];
            var childNodes = self.container.childNodes;

            vfs.readdir(this.path, options, function (err, meta) {
                if (err) {
                    var nerr = new Error(err.message);
                    throw nerr;
                }
                if (meta.notModified) {
                    children = cached;
                    cached.forEach(insert);
                    finish();
                    return;
                }
                children.etag = meta.etag;
                meta.stream.on("data", onData);
                meta.stream.on("end", onEnd);
            });

            function insert(data, i) {
                var Constructor = data.isDir ? Folder : Entry;
                var child = new Constructor(self.path, data);
                child.render();
                if (i === childNodes.length) {
                    self.container.appendChild(child.el);
                }
                else {
                    self.container.insertBefore(child.el, childNodes[i]);
                }
                if (openFolders[child.path]) child.open();
            }

            function onData(data) {
                if (!showHidden && data.name[0] === ".") return;
                data.isDir = (/(directory|folder)$/).test(data.mime);

                // Insert the data into the children array, but sort by type and name.
                for (var i = 0, l = children.length; i < l; i++) {
                    var old = children[i];
                    // Directories always come first
                    if ((!old.isDir) && data.isDir) break;
                    // Then sort by name
                    if (old.isDir == data.isDir) {
                        if (old.name.toLowerCase().localeCompare(data.name.toLowerCase()) > 0) {
                            break;
                        }
                    }
                }
                children.splice(i, 0, data);
                insert(data, i);
            }

            function onEnd() {
                cache[self.path] = children;
                finish();
            }

            function finish() {
                if (!children.length) {
                    self.container.appendChild(domBuilder(
                        ["li.empty", "empty"]
                    ));
                }
                self.state = "opened";
                openFolders[self.path] = true;
                self.update();
            }


        };

        Folder.prototype.close = function () {
            this.el.removeChild(this.container);
            this.state = "closed";
            delete openFolders[this.path];
            this.update();
        };

        function go() {
            selected = null;
            var path = history[index];
            localStorage.treeRoot = path;
            if (path[path.length - 1] === "/") {
                path = path.substr(0, path.length - 1);
            }
            var parents = [""];
            var i = 0;
            while (path && i >= 0) {
                i = path.indexOf("/", i + 1);
                if (i >= 0) {
                    parents.push(path.substr(0, i));
                }
                else {
                    parents.push(path);
                }
            }

            var tree = domBuilder([
                ["#navigation",
                    ["a", index > 0 ? {
                        "class": "button",
                        onclick: onHistoryBack
                    } : {
                        "class": "button disabled"
                    }, ["i.icon-chevron-left"]],
                    ["a", index < history.length - 1 ? {
                        "class": "button",
                        onclick: onHistoryForward
                    } : {
                        "class": "button disabled"
                    }, ["i.icon-chevron-right"]],
                    [".sep"],
                    ["a", path ? {
                        "class": "button",
                        onclick: onGoParent
                    } : {
                        "class": "button disabled"
                    }, ["i.icon-chevron-up"]],
                    [".sep"],
                    ["a.button", {onclick: onRefresh, title: "Manually refresh the tree"}, ["i.icon-refresh"]],
                    [".sep"],
                    ["a.button", {onclick: onToggleHidden, title: "Toggle showing hidden files"}, ["i.icon-lock"]]
                ],
                ["#history",
                    ["select", {onchange: onChangeParent}, parents.map(function (item, i) {
                        var attribs = {value:item};
                        if (i === parents.length - 1) {
                            attribs.selected = "selected";
                        }
                        return ["option", attribs, item || "/"];
                    })]
                ],
                ["ul#treeview", "loading..."]
            ]);
            document.getElementById("file_browser").textContent = "";
            document.getElementById("file_browser").appendChild(tree);
            var root;
            vfs.stat(path, {}, function (err, stat) {
                if (err) throw err;
                root = new Folder(path.substr(0, path.lastIndexOf("/")), stat);
                root.render();
                root.open();
                var treeview = document.getElementById('treeview');
                treeview.textContent = "";
                treeview.appendChild(root.el);
            });

            function onHistoryBack(evt) {
                index--;
                go();
            }

            function onHistoryForward(evt) {
                index++;
                go();
            }

            function onGoParent(evt) {
                push(parents[parents.length - 2]);
            }

            function onChangeParent(evt) {
                push(this.value);
            }

            function onToggleHidden(evt) {
                showHidden = !showHidden;
                var iconClass = showHidden ? "icon-unlock" : "icon-lock";
                this.firstChild.setAttribute("class", iconClass);
                root.close();
                root.open();
            }

            function onRefresh(evt) {
                root.close();
                root.open();
            }

        }

        function push(path) {
            history.length = index + 1;
            history.push(path);
            index = history.length - 1;
            go();
        }


        history.push(localStorage.treeRoot || "/");
        index = 0;
        go();


        register();

    }

    return setup;

});

*/