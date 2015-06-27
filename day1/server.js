var url = require('url');
var http = require('http');
var mime = require('./mime').types;
var path = require('path');
var fs = require('fs');
var util = require('util');


var root = '/Users/David/Downloads',
    host = 'localhost',
    port = '8080';


if(!fs.existsSync(root)){
	util.error(root+' Not Found, please check');
	process.exit();
}

//list files
function listDirectory(parent, request, response){
	fs.readdir(parent, function(error, files){
		var body = formatBody(parent, files);
		response.writeHead(200, {
			"Content-Type":"text/html;charset=utf-8",
            "Content-Length":Buffer.byteLength(body,'utf8'),
            "Server":"NodeJs("+process.version+")"
		});
		response.write(body, 'utf-8');
		response.end();
	});
}

 function lookupExtension(mime,ext, fallback) {
    return mime[ext.toLowerCase()] || fallback || 'text/plain';
  }

function showFile(file, request, response){
	fs.readFile(filename, 'binary', function(error, file){
		var contentType = lookupExtension(mime, path.extname(filename));
		response.writeHead(200, {
			"Content-Type":contentType,
            "Content-Length":Buffer.byteLength(file,'binary'),
            "Server":"NodeJs("+process.version+")"
		});
		response.write(file, 'binary');
		response.end();
	});
}

function formatBody(parent,files){
    var res=[],
        length=files.length;
    res.push("<!doctype>");
    res.push("<html>");
    res.push("<head>");
    res.push("<meta http-equiv='Content-Type' content='text/html;charset=utf-8'></meta>")
    res.push("<title>Node.js文件服务器</title>");
    res.push("</head>");
    res.push("<body width='100%'>");
    res.push("<ul>")
    files.forEach(function(val,index){
        var stat=fs.statSync(path.join(parent,val));
        if(stat.isDirectory(val)){
            val=path.basename(val)+"/";
        }else{
            val=path.basename(val);
        }
        res.push("<li><a href='"+val+"'>"+val+"</a></li>");
    });
    res.push("</ul>");
    res.push("<div style='position:relative;width:98%;bottom:5px;height:25px;background:gray'>");
    res.push("<div style='margin:0 auto;height:100%;line-height:25px;text-align:center'>Powered By Node.js</div>");
    res.push("</div>")
    res.push("</body>");
    return res.join("");
}


function write404(req,res){
    var body="文件不存在:-(";
    res.writeHead(404,{
        "Content-Type":"text/html;charset=utf-8",
        "Content-Length":Buffer.byteLength(body,'utf8'),
        "Server":"NodeJs("+process.version+")"
    });
    res.write(body);
    res.end();
}

http.createServer(function(req,res){
    //将url地址的中的%20替换为空格，不然Node.js找不到文件
    var pathname=url.parse(req.url).pathname.replace(/%20/g,' '),
        re=/(%[0-9A-Fa-f]{2}){3}/g;
    //能够正确显示中文，将三字节的字符转换为utf-8编码
    pathname=pathname.replace(re,function(word){
        var buffer=new Buffer(3),
            array=word.split('%');
        array.splice(0,1);
        array.forEach(function(val,index){
            buffer[index]=parseInt('0x'+val,16);
        });
        return buffer.toString('utf8');
    });
    if(pathname=='/'){
        listDirectory(root,req,res);
    }else{
        filename=path.join(root,pathname);
        fs.exists(filename,function(exists){
            if(!exists){
                util.error('找不到文件'+filename);
                write404(req,res);
            }else{
                fs.stat(filename,function(err,stat){
                    if(stat.isFile()){
                        showFile(filename,req,res);
                    }else if(stat.isDirectory()){
                        listDirectory(filename,req,res);
                    }
                });
            }
        });
    }
    
    
}).listen(port,host);

util.debug("服务器开始运行 http://"+host+":"+port)

