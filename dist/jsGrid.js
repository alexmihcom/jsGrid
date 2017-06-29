var jsGrid = function() {
    var _this = this;
    this.current = this;
    this._data = {};                                    // form data
    this._tableData = [];
    this._token = null;

    this._page = 1;
	this._limit = 10;
	this._total = 0;
    this._filter = {};

    this._currentModal = null;

    this._config = {
        formElement: null,
        tableElement: null,

        createAjaxUrl: null,
        updateAjaxUrl: null,
        deleteAjaxUrl: null,
        readAjaxUrl: null,
        listAjaxUrl: null,

        keyFields: ['id'],

        bootstrapTable: {
            iconsPrefix: 'font-icon',
            icons: {
                paginationSwitchDown:'font-icon-arrow-square-down',
                paginationSwitchUp: 'font-icon-arrow-square-down up',
                refresh: 'font-icon-refresh',
                toggle: 'font-icon-list-square',
                columns: 'font-icon-list-rotate',
                export: 'font-icon-download',
            },
            paginationPreText: '<i class="font-icon font-icon-arrow-left"></i>',
            paginationNextText: '<i class="font-icon font-icon-arrow-right"></i>',
        },
    }

    this.__defineGetter__('data', function() {
        return _this.current._data;
    });

    this.__defineSetter__('data', function(val) {
        _this.current._data = val;
        for(var i in _this.current._data) {
            $(_this.current.config.formElement).find('[name=' + i + ']').val(_this.current._data[i]);
        }
    });

    this.__defineGetter__('tableData', function() {
        return _this.current._tableData;
    });

    this.__defineSetter__('tableData', function(val) {
        _this.current._tableData = val;
        $(_this.current.config.tableElement).bootstrapTable('load', val);
    });

    this.__defineGetter__('config', function() {
        return _this.current._config;
    });

    this.__defineSetter__('config', function(val) {
        _this.current._config = $.extend(true, _this._config, val);
    });
    
    this.transformToNames = function(obj) {
        var res = [];
        Object.keys(obj).forEach(function(key) {
            var names = key.split('.');
            var name = names.reduce(function(prev, current) {
                name = `${prev}[${current}]`;
                return name;
            });
            res[name] = obj[key];
        });
        return res;
    }

    /**
     * Show list with ajax
     */
    this.list = function(e) {
        if(e != undefined) e.preventDefault();
        $('.loader').show();
        $.ajax({
            url: _this.current.config.listAjaxUrl,
            method: 'GET',
            data: $.extend(_this.current._filter, {
                page: _this.current._page,
                //limit: _this.current._limit,
            }),
            type: 'json',
            success: _this.current.afterList,
            error: function (response) {
                console.log('Ajax error:', response);
            }
        });
    }

    /**
     * After show list with ajax
     */
    this.afterList = function(response) {
        _this.current.tableData = response.data;
        _this.current.pagination(response);
        $('.loader').hide();
    }

    /**
     * Submit form data with ajax
     * @param Event e
     */
    this.create = function(e) {
        if(e != undefined) e.preventDefault();
        $(_this.current._currentModal).bootstrapFromError('reset');
        $('.loader').show();

        $.ajax({
            url: _this.current.config.createAjaxUrl,
            method: 'POST',
            data: $(_this.current._currentModal).formObject('get'),
            type: 'json',
            success: _this.current.afterCreate,
            error: function (response) {
                console.log('Ajax error:', response);
            }
        });
    }

    /**
     * After create with ajax
     */
    this.afterCreate = function(response) {
        $('.loader').hide();
        if(typeof response.errors !== 'undefined') {
            $(_this.current._currentModal)
                .bootstrapFromError('reset')
                .bootstrapFromError('set', _this.transformToNames(response.errors), 'error')
        } else {
            if(response.redirect != undefined) {
                window.location = response.redirect;
            } else if(_this.current.config.listAjaxUrl != null) {
                _this.current._currentModal.modal('hide');
                _this.current.list();
            }
        }
    }

    /**
     * Read data form with ajax
     * @param Event e
     * @returns {Boolean}
     */
    this.read = function(e) {
        if(e != undefined) e.preventDefault();
        if(_this.current.config.readAjaxUrl == null) return false;
        $('.loader').show();

        return true;
    }

    /**
     * Submit form data with ajax
     * @param Event e
     */
    this.update = function(e) {
        if(e != undefined) e.preventDefault();
        $(_this.current._currentModal).bootstrapFromError('reset');
        $('.loader').show();
        $.ajax({
            url: _this.current.config.updateAjaxUrl,
            method: 'POST',
            data: $(_this.current._currentModal).formObject('get'),
            type: 'json',
            success: _this.current.afterUpdate,
            error: function (response) {
                console.log('Ajax error:', response);
            }
        });
    }

    /**
     * After update with ajax
     */
    this.afterUpdate = function(response) {
        $('.loader').hide();
        if(typeof response.errors !== 'undefined') {
            $(_this.current._currentModal)
                .bootstrapFromError('reset')
                .bootstrapFromError('set', response.errors, 'error')
        } else {
            if(response.redirect != undefined) {
                window.location = response.redirect;
            } else if(_this.current.config.listAjaxUrl != null) {
                _this.current._currentModal.modal('hide');
                _this.current.list();
            }
        }
    }

    /**
     * Delete with ajax
     * @param Event e
     * @returns {Boolean}
     */
    this.delete = function(data) {
        if(_this.current.config.deleteAjaxUrl == null) return false;
        if(data == undefined) return false;
        $('.loader').show();
        data._token = _this.current._token;
        $.ajax({
            url: _this.current.config.deleteAjaxUrl,
            method: 'POST',
            data: data,
            type: 'json',
            success: _this.current.afterDelete,
            error: function (response) {
                console.log('Ajax error:', response);
            }
        });

        return true;
    }

    /**
     * After delete with ajax
     */
    this.afterDelete = function(response) {
        $('.loader').hide();
        if(typeof response.errors !== 'undefined') {
            $(_this.current._currentModal)
                .bootstrapFromError('reset')
                .bootstrapFromError('set', response.errors, 'error')
        } else {
            if(response.redirect != undefined) {
                window.location = response.redirect;
            } else if(_this.current.config.listAjaxUrl != null) {
                _this.current._currentModal.modal('hide');
                _this.current.list();
            }
        }
    }

    /**
     * Init function
     */
    this.init = function() {

        _this.current._token = $('meta[name=csrf_token]').attr('content');
        // add token to form
        if(_this.current.config.formElement !== null && _this.current._token !== undefined) {
            $(_this.current.config.formElement).append('<input type="hidden" name="_token" value="' + _this.current._token + '" />');
        }

        $(_this.current.config.formElement).bootstrapFromError();
        //$(_this.current.config.formElement).bootstrapFromError('reset');

        if(_this.current.config.updateAjaxUrl != null
                && _this.current.config.tableElement != null) {
            _this.current.config.bootstrapTable.columns.push({
                field: 'update',
                title: 'Обн',
                width: '40',
                sortable: false,
                formatter: _this.current.updateIcon,
                events: _this.current.updateIconEvents,
            });
        }

        if(_this.current.config.deleteAjaxUrl != null
                && _this.current.config.tableElement != null) {
            _this.current.config.bootstrapTable.columns.push({
                field: 'delete',
                title: 'Уд',
                width: '40',
                sortable: false,
                formatter: _this.current.deleteIcon,
                events: _this.current.deleteIconEvents,
            });
        }

        // init bootstrap table if config set
        if(_this.current.config.tableElement != null) {
            $(_this.current.config.tableElement).bootstrapTable(_this.current.config.bootstrapTable);
        }

        // update bootstrap table content by ajax
        if(_this.current.config.listAjaxUrl != null) {
            _this.current.list();
        }
    }

    this.deleteIconEvents = {
        'click .js-icon-delete': function (e, value, row, index) {
            _this.current.modalDelete(row);
        }
    }

    this.deleteIcon = function(index, row, element) {
        return '<i href="#" class="font-icon glyphicon glyphicon-trash action-icon js-icon-delete" aria-hidden="true" data-id="' + row.id + '" ><span class="sr-only" >Удалить</span></i>';
    }

    this.updateIconEvents = {
        'click .js-icon-update': function (e, value, row, index) {
            _this.current.modalUpdate(row);
        }
    }

    this.updateIcon = function(index, row, element) {
        return '<i href="#" class="font-icon font-icon-pencil action-icon js-icon-update" aria-hidden="true" data-id="' + row.id + '" ><span class="sr-only" >Редактировать</span></i>';
    }

    this.modalCreate = function(e) {
        $(_this.current._currentModal).bootstrapFromError('reset');
        _this.current._currentModal = bootbox.confirm({
            title: 'Добавить',
            message: $(_this.current.config.formElement).html(),
            buttons: {
                confirm: {
                    label: 'Сохранить',
                    className: 'btn-success',
                },
                cancel: {
                    label: 'Отмена'
                }
            },
            'callback': function (result) {
                if(result) {
                    _this.current.create();
                } else {
                    bootbox.hideAll();
                }
                return false;
            }
        });

        _this.current.initModalCreate();

        if(typeof(e) != 'undefined') {
            e.preventDefault();
            e.stopPropagation();
        }
    }

    this.modalUpdate = function(data) {
        $(_this.current._currentModal).bootstrapFromError('reset');
        _this.current._currentModal = bootbox.confirm({
            title: 'Обновить',
            message: $(_this.current.config.formElement).html(),
            buttons: {
                confirm: {
                    label: 'Сохранить',
                    className: 'btn-success',
                },
                cancel: {
                    label: 'Отмена'
                }
            },
            'callback': function (result) {
                if(result) {
                    _this.current.update();
                } else {
                    bootbox.hideAll();
                }
                return false;
            }
        });
        $(_this.current._currentModal).formObject('set', data);
        _this.current.initModalUpdate();
    }

    this.modalDelete = function(data) {
        $(_this.current._currentModal).bootstrapFromError('reset');
        _this.current._currentModal = bootbox.confirm({
            message: 'Удалить запись?',
            buttons: {
                confirm: {
                    label: 'Да',
                    className: 'btn-danger',
                },
                cancel: {
                    label: 'Нет'
                }
            },
            'callback': function (result) {
                if(result) {
                    _this.current.delete(data);
                } else {
                    bootbox.hideAll();
                }
                return false;
            }
        });
        _this.current.initModalDelete();
    }

    this.initModalCreate = function() {

    }
    this.initModalUpdate = function() {

    }
    this.initModalDelete = function() {

    }
    
    this.pagination = function(response) {
        if(typeof(response.last_page) == 'undefined' || response.last_page <= 1) {
            return false;
        }
        
        let tbody = $(_this.current.config.tableElement).closest('.fixed-table-body');
        if($(tbody).find('.js-pager').length == 0) {
           $(tbody).append('<nav class="text-center js-pager"></nav>');
        }
        
        let html = `<ul class="pagination">`;
            for(let i = 1; i <= response.last_page; i++) {
                html += `<li data-page="${i}" ><a href="#" data-page="${i}" >${i}</a></li>`;
            }
            html += `</ul>`;
        
        $(tbody).find('.js-pager').html(html);
        $(tbody).find(`.js-pager li[data-page="${response.current_page}"]`).addClass('active');
        $(tbody).find('.js-pager a').click(function(e) {
            e.preventDefault();
            
            _this.current._page = $(this).attr('data-page');
            _this.current.list();
        });
    }

    // init filters
    let query = window.location.search.replace('?', '').split('&');
    for(let i in query) {
        let param = query[i].split('=');
        if(typeof(param[1]) == 'string' && param[1] != '') {
            _this.current._filter[param[0]] = param[1];
        }
    }

    $(document).ready(function() {
        _this.current.init();
    });

    return this;
}
