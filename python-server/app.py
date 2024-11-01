from flask import Flask, request, jsonify
import sys
import io

app = Flask(__name__)

@app.route('/exec', methods=['POST'])
def hello():
    data = request.get_json()
    print('REQUEST INTERCEPTED WITH DATA: ', data)
    code: str = data.get('code', '')

    if len(code) == 0:
        return jsonify(result='No code provided'), 400

    # Capture the output
    output = io.StringIO()
    try:
        # Redirect stdout to capture print statements
        sys.stdout = output
        # Execute the provided code
        code = compile(code, '<string>', 'exec')
        exec(code, globals())
        # Get the output from the executed code
        result = output.getvalue()
    except Exception as e:
        # Handle any exceptions that occur during code execution
        result = str(e)
    finally:
        # Restore stdout
        sys.stdout = sys.__stdout__

    print('RESULT: ', result)
    return jsonify(result=result)

if __name__ == '__main__':
    app.run(port=4000, debug=True)
