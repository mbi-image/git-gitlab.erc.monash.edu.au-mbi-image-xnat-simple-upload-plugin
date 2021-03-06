
// for plugin build
var XNAT_URL = XNAT.url.rootUrl() ;
var resource_extension_map = {};
var resource_extension_map_reverse = {};

$(document).ready(function() {
    // TODO: prevent forced yellow input background in chrome
    console.log("loaded simpleUploadApp");
    //remove submit event listener on submit button
    //$('#login_form').removeEventListener('submit');
    //load extension Type map
    var extension_map = {"NIFTI": ".nii",
        "NIFTI_GZ": ".nii.gz",
        "MRTRIX": ".mif",
        "DICOM": "",
        "TEXT_MATRIX": ".mat",
        "MRTRIX_GRAD": ".b",
        "FSL_BVECS": ".bvec",
        "FSL_BVALS": ".bval",
        "MATLAB": ".mat",
        "ANALYZE": ".img",
        "ZIP": ".zip",
        "RDATA": ".rdata",
        "DAT": ".dat",
        "TEXT": ".txt",
        "TAR_GZ": ".tar.gz"};
    resource_extension_map = JSON.stringify(extension_map)
    console.log(resource_extension_map);
    //submit form
    $("#sendButton").click(function(event) {
        $("#login_form :input").prop("disabled", true);
        event.preventDefault();
        //alert("Test")
        $('#layout_content2').css('display', 'none');
        $('#layout_content').css('display', 'block');
        $(':input[type="submit"]').prop('disabled', true);
        var data;
        data = new FormData($('login_form')[0]);
        var datasetName = $("#datasetName").val();
        console.log(datasetName);
        var sessionName = $("#sessionID").val();
        console.log(sessionName)
        var split = sessionName.split("_");
        var projectId = split[0];
        var subjectId = projectId+'_'+split[1];
        //check if create session is true
        if($('#createSession').is(':checked')){
            //create subject then create session
            createSubject(projectId,subjectId).then(createSession(projectId,subjectId,sessionName));
        }else{
            //validate sessionId and dataset
            //create dataset
        }
        //create dataset and upload files
        $.ajax({
            type: 'PUT',
            url: XNAT_URL+'data/archive/projects/'+projectId+'/subjects/'+subjectId+'/experiments/'+sessionName+'/scans/'+datasetName+'?xsiType=xnat:mrScanData&XNAT_CSRF='+csrfToken,
            xhrFields: {
                withCredentials: true
            },
            async: false,
            headers: {
                'Content-Type':'application/x-www-form-urlencoded',

            },
            success: function(response, status, xhr) {
                console.log(response.status)
                //upload file or files
                var fileList = $('input[type=file]')[0].files;
                if(fileList.length == 1){
                    uploadFile(projectId,subjectId,sessionName,datasetName);
                }else{
                    uploadFiles(projectId,subjectId,sessionName,datasetName)
                }
            },
            error: function(response) {
                console.log(response)
            }
        });
    });
    function createSubject(projectId, subjectId){
        return $.ajax({
            type: 'PUT',
            url: XNAT_URL+'data/archive/projects/'+projectId+'/subjects/'+subjectId+'?XNAT_CSRF='+csrfToken,
            xhrFields: {
                withCredentials: true
            },
            async: false,
            headers: {
                'Content-Type':'application/x-www-form-urlencoded',
            },
            success: function(response, status, xhr) {
                console.log(response)
                return response;
            },
            error: function(response) {
                console.log(response)
            }
        });
    }
    function createSession(projectId, subjectId, sessionName){
        return $.ajax({
            type: 'PUT',
            url: XNAT_URL+'data/projects/'+projectId+'/subjects/'+subjectId+'/experiments/'+sessionName+'?xsiType=xnat:mrSessionData?XNAT_CSRF='+csrfToken,
            xhrFields: {
                withCredentials: true
            },
            async: false,
            headers: {
                'Content-Type':'application/x-www-form-urlencoded',
            },
            success: function(response, status, xhr) {
                console.log(response.status)
            },
            error: function(response) {
                console.log(response)
            }
        });
    }
    function uploadFile(projectId, subjectId, sessionName,datasetName){

        var form = new FormData();
        var file = $('input[type=file]')[0].files[0];
        form.append('file', file);
        var fileName = file.name;
        console.log(fileName);
        var extension = getExtension(fileName);
        var resourceType = getResourceType(extension);
        console.log(resourceType);
        $.ajax({
            type: 'POST',
            url: XNAT_URL +'data/archive/projects/'+projectId+'/subjects/'+subjectId+'/experiments/'+sessionName+'/scans/'+datasetName+'/resources/'+resourceType+'/files/'+fileName+'?XNAT_CSRF='+csrfToken,
            xhrFields: {
                withCredentials: true
            },
            //Form data
            "processData": false,
            "contentType": false,
            "mimeType": "multipart/form-data",
            "data": form,
            "async": true,
            xhr: function () {
                var xhr = new window.XMLHttpRequest();
                xhr.upload.addEventListener("progress", function(evt){
                    if(evt.lengthComputable) {
                        var percentComplete = evt.loaded / evt.total;
                        percentComplete = parseInt(percentComplete * 100);
                        $('.myprogress').text(percentComplete + '%');
                        $('#progress_bar').css({'display':'block'});
                        $('.progress').css({'display':'block'});
                        $('.myprogress').css('width', percentComplete + '%');
                    }
                },false);
                return xhr;
            },
            success: function(response, status, xhr) {
                $('.msg').css({'color':'green'});
                $('.msg').text(fileName+" uploaded successfully");
                //$('.msg').css({'display':'none'});
                $(':input[type="submit"]').prop('disabled', false);
                $("#login_form").trigger('reset');
                location.reload();
                //alert("file uploaded successfully");
            },
            error: function(response) {
                console.log(response)
                alert("Could not upload file ..." +response.status);
            }
        });
    }

    function uploadFiles(projectId,subjectId,sessionName,datasetName) {
        var files = $('input[type=file]')[0].files;
        for(i=0;i<files.length;i++) {
            fileName = files[i].name
            $('.msg').css({'color':'green'});
            $('.msg').text("uploading "+ fileName);
            var form = new FormData();
            form.append('file', files[i]);
            $.ajax({
                type: 'POST',
                url: XNAT_URL +'data/archive/projects/'+projectId+'/subjects/'+subjectId+'/experiments/'+sessionName+'/scans/'+datasetName+'/resources/'+'undefined'+'/files/'+fileName+'?XNAT_CSRF='+csrfToken,
                xhrFields: {
                    withCredentials: true
                },
                //Form data
                "processData": false,
                "contentType": false,
                "mimeType": "multipart/form-data",
                "data": form,
                "async": false,

                success: function(response, status, xhr) {
                    $('.msg').css({'color':'green'});
                    $('.msg').text(fileName+" uploaded successfully");
                    //$('.msg').css({'display':'none'});
                    //alert("file uploaded successfully");
                },
                error: function(response) {
                    console.log(response)
                    alert("Could not upload file ..." +response.status);
                }
            });
        }
        $(':input[type="submit"]').prop('disabled', false);
        $("#login_form").trigger('reset');
        location.reload();
    }
    function getExtension(fileName) {
        var firstIndexofDot = fileName.indexOf(".");
        var extension = fileName.substr(firstIndexofDot);
        return extension;
    }
    function getResourceType(extension){
        var resourceType = resource_extension_map[extension];
        return resourceType;
    }

// methods
var project_id ;
var experiment_id;
var xsiType;
var datasetName;
$("#sessionID").focusout(function(e) {
    var sessionID = $("#sessionID").val();
    $.ajax({
        type: 'GET',
        dataType : "json",
        url: XNAT_URL+'data/archive/experiments?label='+sessionID,
        xhrFields: {
            withCredentials: true
        },
        async: false,
        headers: {
            'Content-Type':'application/x-www-form-urlencoded'
        },
        success: function(response, status, xhr) {
            console.log(status);
            var resultset = response.ResultSet.totalRecords;
            console.log(resultset);
            if(resultset > 0){

                $('#sessionID').css({'color':'green'});
                $('#createSession').prop('checked', false);
                $('#createSession').prop('disabled', true);
                $('#inferProjectID').prop('disabled', false);
                $('#inferSubjectID').prop('disabled', false);
                project_id = response.ResultSet.Result["0"].project;
                experiment_id = response.ResultSet.Result["0"].ID;
                xsiType = response.ResultSet.Result["0"].xsiType
            }
            else{
                $('#sessionID').css({'color':'red'});
                $('#sessionID').prop('disabled', false);
            }
        },
        error: function(response) {
            //console.log(response)
        }
    });
});
$("#inferProjectID").change(function(){
    var sessionID = $("#sessionID").val();
   if(this.checked && "" !== sessionID) {
      var projectName = sessionID.split("_")[0]
       $("#projectName").val(projectName);
       $("#projectName").trigger("focusout");
   }
});
$("#inferSubjectID").change(function(){
    var sessionID = $("#sessionID").val();
    if(this.checked && "" !== sessionID) {
        var subjectID = sessionID.split("_")[0]+"_"+sessionID.split("_")[1]
        $("#SubjectID").val(subjectID);
        $("#SubjectID").trigger("focusout");
    }
});
$('input[type=file]').change(function(e){
    var file_count = $(this).get(0).files.length
    console.log(file_count)
    if (file_count > 1 ){
        //disable checkbox
        $("#inferResourceType").prop("disabled", true)
    }else{
        //display file format
        var file = $(this).get(0).files[0];
        var extension = file.name.substr( (file.name.lastIndexOf('.') +1) );
        console.log(extension)
        $("#ResourceType").val(extension)
    }
});
$("#projectName").focusout(function(e) {
    var projectName = $("#projectName").val();
    $.ajax({
        type: 'GET',
        dataType : "json",
        url: XNAT_URL+'data/projects/'+projectName+'?format=json',
        xhrFields: {
            withCredentials: true
        },
        async: false,
        headers: {
            'Content-Type':'application/x-www-form-urlencoded'
        },
        success: function(response, status, xhr) {
            console.log(response);

            if(response.items.length > 0){

                $('#projectName').css({'color':'green'});

            }
            else{
                $('#projectName').css({'color':'red'});
            }
        },
        error: function(response) {
            $('#projectName').css({'color':'red'});
        }
    });
});
$("#SubjectID").focusout (function(e) {
    var subjectID = $("#SubjectID").val();
    var projectName = $("#projectName").val();
    $.ajax({
        type: 'GET',
        dataType : "json",
        url: XNAT_URL+'data/projects/'+projectName+'/subjects/'+ subjectID +'?format=json',
        xhrFields: {
            withCredentials: true
        },
        async: false,
        headers: {
            'Content-Type':'application/x-www-form-urlencoded'
        },
        success: function(response, status, xhr) {
            console.log(status);
            if(response.items.length > 0){

                $('#SubjectID').css({'color':'green'});

            }
            else{
                $('#SubjectID').css({'color':'red'});
            }
        },
        error: function(response) {
            $('#SubjectID').css({'color':'red'});
        }
    });
});
$("#datasetName").on('input',function(e) {
    // if session name exist, then check for dataset
    // if session name does not exist, create session and dataset
    if($('#createSession').is(':checked')){
        //don't validate dataset name
        $('#datasetName').css({'color':'green'});
    }else{
        //validate dataset name
        datasetName = $("#datasetName").val();
        var sessionName = $("#sessionName").val();
        //
        $.ajax({
            type: 'GET',
            dataType : "json",
            url: XNAT_URL+'data/experiments/'+experiment_id+'/scans',
            xhrFields: {
                withCredentials: true
            },
            headers: {
                'Content-Type':'application/x-www-form-urlencoded',
            },
            success: function(response, status, xhr) {
                var responseObjArray = response.ResultSet.Result;
                var found = 0;
                for(var obj in responseObjArray){
                    if(responseObjArray[obj].ID==datasetName){
                        found = 1;
                    }
                }
                if(found==1){
                    $('#datasetName').css({'color':'red'});
                }else{
                    $('#datasetName').css({'color':'green'});
                }
            },
            error: function(response) {
                //console.log(response)
            }
        });
    }

});

});