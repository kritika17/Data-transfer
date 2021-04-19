'use strict';
(function (window, document, $, Sortable) {
  const customEndpoints = window.khorosCustomEndpoint,
  topicLimit = 6,
  corenodeId = window.coreNode,
  messageId = window.messageId,
  nodeType = window.nodeType,
  requests = new Map(),
	urls = {
	  custom: {
	    updateTopics: `${customEndpoints}custom-post-updatetopics`,
	    topicsPage: `${customEndpoints}topics-page`
	  }
	},
	$el = {
	  ootbLabelField: $('.lia-js-labels-editor-input'),
	  submit:$('.lia-button-wrapper-Submit-action').find('.spectrum-Button'),
	  topicsLocation:$('.lia-input-edit-form-column').find('.lia-form-revision-information-fieldset-toggle').attr('id'),
	  topicstab:$('#topics-tab')
	},
	o = window.observer;

	let labelValue = $el.ootbLabelField.val(),
	selectedOptionQueue = [],
  lang = '',
  updatedlabelValue = selectedOptionQueue.toString(),
  topic_value = '';

  function hash (arg = '') {
    let result = 0;

    if (arg.length > 0) {
      let i = -1,
        nth = arg.length,
        chr;

      while (++i < nth) {
        chr = arg.charCodeAt(i);
        result = (result << 5) - result + chr;
        result |= 0;
      }
    }

    return result;
  }

  function log (arg, type = 'log', ts = true) {
    const timestamp = type !== 'error' && ts ? new Date().getTime() : 0;

    if (timestamp > 0) {
      console[type](arg instanceof Object ? arg : `[app:${timestamp}] ${arg}`);
    } else {
      console[type](arg);
    }
  }

  async function request (uri, options = {method: 'GET', headers: {}, body: ''}) {
    const url = new URL(uri.includes('://') ? uri : `${location.origin}${uri}`);
    let llang = lang;

    if (llang.length > 0) {
      if (url.searchParams.has('lang') === false) {
        url.searchParams.set('lang', llang);
      } else {
        llang = url.searchParams.get('lang');
      }

      if ('accept-language' in options.headers === false) {
        options.headers['accept-language'] = `${llang};q=0.9`;
      }
    }

    const key = `${options.method || 'GET'}_${hash(url.href)}_${hash(options.headers.authorization || 'anon')}_${hash(JSON.stringify(options.body || ''))}`;

    if (requests.has(key) === false) {
      if (options.method === 'GET' || options.method === 'HEAD') {
        delete options.body;
      }

      const p = fetch(url.href, options).then(arg => {
        requests.delete(key);

        return arg;
      }).catch(err => {
        requests.delete(key);

        throw err;
      });

      requests.set(key, p);
    }

    return requests.get(key).then(arg => arg.clone());
  }

	function labelUpdationfunc(arrayString){
    if(labelValue!=""){
      updatedlabelValue = labelValue+","+arrayString;
    }else{
      updatedlabelValue = arrayString;
    }
    if(window.pageName === 'PostPage'){
      $el.ootbLabelField.val(updatedlabelValue);
    }
  }

  //Tooltip
	$('body').on('mouseover', '.u-tooltip-showOnHover', ev => {
		const $elem = $(ev.currentTarget);
		$elem.find(".spectrum-Tooltip-typeIcon use").attr("xlink:href","#spectrum-icon-18-Info");
	}).on('mouseout','.u-tooltip-showOnHover', ev => {
		const $elem = $(ev.currentTarget);
		$elem.find(".spectrum-Tooltip-typeIcon use").attr("xlink:href","#spectrum-icon-18-InfoOutline"); 
	});
 

  //Action on clickng the Add topic Link
	 $(document).on('click', '#add-topic', async ev => {
	 	ev.stopPropagation();
		ev.preventDefault();

		const $elem = $(ev.currentTarget),
		url = new URL(`${window.location.origin}${urls.custom.updateTopics}`);

		$elem.addClass('disabled');

		url.searchParams.append('action', 'add-topic');
		url.searchParams.append('page', window.pageName);
		url.searchParams.append('searchVal','');
		url.searchParams.append('labelValue',labelValue);
		url.searchParams.append('selectedQueue','');
		url.searchParams.append('corenodeID',corenodeId);
		url.searchParams.append('nodeType',nodeType);
		if(window.pageName === 'EditPage'){
			url.searchParams.append('messageId',messageId);
		}
		
		const res = await request(url.href);

		if (res.ok) {
		  const obj = await res.json();
		  $(obj.data.contents).insertBefore('#add-topic');
		  if(selectedOptionQueue.length==(topicLimit-1)){
		   $('#add-topic').hide();
		  }else{
		   $('#add-topic').css('display', 'inline-block');
		  }
		}
	});

	//Updating labels for Edit Page
	if(window.pageName === 'EditPage'){
		$el.submit.on('click', () => {
			$el.ootbLabelField.val(selectedOptionQueue.toString());
		});
	}

	//Open the Suggestions while typing in input field
	$('body').on('keyup', '#topics-search input[type="search"]', async ev => {
		const $elem = $(ev.currentTarget),
		popover = $elem.parents('.spectrum-SearchWithin').find('.spectrum-Popover'),
		searchFieldValue = $elem.val(),
		url = new URL(`${window.location.origin}${urls.custom.updateTopics}`);
		
		if(searchFieldValue==""){
	    popover.removeClass('is-open');
	  }

	  url.searchParams.append('action', 'search-topics');
	  url.searchParams.append('page', window.pageName);
	  url.searchParams.append('searchVal',searchFieldValue);
	  url.searchParams.append('labelValue',labelValue);
	  url.searchParams.append('selectedQueue',selectedOptionQueue.toString());
	  url.searchParams.append('corenodeID',corenodeId);
	  url.searchParams.append('nodeType',nodeType);
	  if(window.pageName === 'EditPage'){
			url.searchParams.append('messageId',messageId);
		}

	  const res = await request(url.href);

	  if (res.ok) {
	    const obj = await res.json();
	    $('#spectrum-menu').html(obj.data.contents);
	    if(searchFieldValue==""){
	    	$('#spectrum-menu').html("");
	      popover.removeClass('is-open');
	    }else{
        popover.addClass('is-open');
      }
	   }
 
	});

	if(window.pageName === 'EditPage' || window.pageName === 'PostPage'){

		$(document).on('click', '#topicsWrapper .spectrum-Menu-item', async ev => {
		  const $elem = $(ev.currentTarget),
		  selectedOptionText = $elem.find('span').text(),
		  url = new URL(`${window.location.origin}${urls.custom.updateTopics}`);

		  $('.spectrum-SearchWithin').remove();

	    url.searchParams.append('action', 'select-topic');
	  	url.searchParams.append('page', window.pageName);
	  	url.searchParams.append('searchVal','');
	  	url.searchParams.append('labelValue',labelValue);
	  	url.searchParams.append('selectedQueue',selectedOptionText);
	  	url.searchParams.append('corenodeID',corenodeId);
	  	url.searchParams.append('nodeType',nodeType);
	  	if(window.pageName === 'EditPage'){
				url.searchParams.append('messageId',messageId);
			}

	  	const res = await request(url.href);

	  	if (res.ok) {
	  	  const obj = await res.json();
	  	  $(obj.data.contents).insertBefore("#add-topic");
	  	}

		  selectedOptionQueue.push(selectedOptionText);
		  if (selectedOptionQueue.length < topicLimit){
		    $("#add-topic").removeClass('disabled');
		    $("#add-topic").css('display', 'inline-block');
		  }else if(selectedOptionQueue.length >= topicLimit){
		     $("#add-topic").hide();
		  }
		  labelUpdationfunc(selectedOptionQueue.toString());
		});

		//Action on click of Clear(X) button in search field
		$(document).on('click', ".spectrum-ClearButton", async ev=> {
		  ev.preventDefault();
		  const $elem = $(ev.currentTarget),
		  objectParent = $elem.parent();
		  if(objectParent.hasClass("spectrum-Tags-item")){
		    const topicValue = objectParent.find('.spectrum-Tags-itemLabel').text(),
		    index = selectedOptionQueue.indexOf(topicValue);
		    if (index > -1) {
		      selectedOptionQueue.splice(index, 1);
		    }
		    labelUpdationfunc(selectedOptionQueue.toString());
		  }
		  objectParent.fadeOut(function(){
		    objectParent.remove();
		  });
		  if(selectedOptionQueue.length<topicLimit){
		    $("#add-topic").removeClass('disabled');
		    $("#add-topic").css('display', 'inline-block');
		  }
		}); 

		document.addEventListener( 'DOMContentLoaded',  async function () {
			console.log("labelValue",labelValue);

			const url = new URL(`${window.location.origin}${urls.custom.updateTopics}`);

			url.searchParams.append('action', 'onload-title');
			url.searchParams.append('page', window.pageName);
			url.searchParams.append('searchVal','');
			url.searchParams.append('labelValue',labelValue);
			url.searchParams.append('selectedQueue',selectedOptionQueue.toString());
			url.searchParams.append('corenodeID',corenodeId);
			url.searchParams.append('nodeType',nodeType);
			if(window.pageName === 'EditPage'){
			  url.searchParams.append('messageId',messageId);
			}
			const res = await request(url.href);
			if (res.ok) {
			  const obj = await res.json();
			  $(obj.data.contents).insertAfter('#'+$el.topicsLocation);
			}

			if(labelValue!=""){	
				const splitExistingLabels = labelValue.split(","),
	      existingTopicsCount = splitExistingLabels.length,
	      url = new URL(`${window.location.origin}${urls.custom.updateTopics}`);

    		if (existingTopicsCount == topicLimit){
          $('#add-topic').hide();
        }

        url.searchParams.append('action', 'onload-topics');
      	url.searchParams.append('page', 'EditPage');
      	url.searchParams.append('searchVal','');
      	url.searchParams.append('labelValue',labelValue);
      	url.searchParams.append('selectedQueue','');
      	url.searchParams.append('corenodeID',corenodeId);
      	url.searchParams.append('nodeType',nodeType);
      	if(window.pageName === 'EditPage'){
    			url.searchParams.append('messageId',messageId);
    		}

    		const res = await request(url.href);
    		if (res.ok) {
    		  const obj = await res.json();
    		  $(obj.data.contents).insertBefore('#add-topic');
    		}

		    for (let index of splitExistingLabels) {
          selectedOptionQueue.push(index);
        }
      }
		});
	}

	//Topics Page
	if(window.pageName=="Community-TopicsPage"){

		document.addEventListener( 'DOMContentLoaded',  async function () {
			const page_url = new URL(window.location.href),
			url = new URL(`${window.location.origin}${urls.custom.topicsPage}`);

			if(page_url.search.includes("?topic=")){
				topic_value = page_url.searchParams.get("topic");
			}

			url.searchParams.append('topic', topic_value);
			url.searchParams.append('sort', 'most-relevant');
			url.searchParams.append('filter', 'all');

			const res = await request(url.href);
			if (res.ok) {
			  const obj = await res.json();
			  $(obj.data.contents).insertAfter($el.topicstab);
			}
		});
	}

}(window, document, window.jQuery, window.Sortable));