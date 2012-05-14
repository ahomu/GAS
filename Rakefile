require 'net/http'
SOURCE = File.read('gas.js')

desc 'build & minify'
task :default do
    File.open('gas.min.js', 'w') {|f|
        uri = URI.parse('http://closure-compiler.appspot.com/compile')
        req = Net::HTTP::Post.new(uri.request_uri)
        req.set_form_data({
            'js_code' => SOURCE,
            'compilation_level' => 'SIMPLE_OPTIMIZATIONS',
            'output_format' => 'text',
            'output_info' => 'compiled_code'
        })
        f << Net::HTTP.start(uri.host, uri.port) {|http| http.request(req).body }
    }
end

desc 'build & minify without legacy IE compatibility'
task :die do
    File.open('gas.min.js', 'w') {|f|
        uri = URI.parse('http://closure-compiler.appspot.com/compile')
        req = Net::HTTP::Post.new(uri.request_uri)
        req.set_form_data({
            'js_code' => SOURCE.gsub(/\/\/\s?@ie-[\s\S]*?\/\/\s?-ie@/, ''),
            'compilation_level' => 'SIMPLE_OPTIMIZATIONS',
            'output_format' => 'text',
            'output_info' => 'compiled_code'
        })
        f << Net::HTTP.start(uri.host, uri.port) {|http| http.request(req).body }
    }
end
