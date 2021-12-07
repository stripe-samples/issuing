# Approve an Issuing authorization

## Requirements

- Python 3
- [Configured .env file](../README.md)

## How to run

1. Create and activate a new virtual environment

**MacOS / Unix**

```
python3 -m venv env
source env/bin/activate
```

**Windows (PowerShell)**

```
python3 -m venv env
.\env\Scripts\activate.bat
```

2. Install dependencies

```
pip install -r requirements.txt
```

3. Export and run the application

**MacOS / Unix**

```
export FLASK_APP=server.py
python3 -m flask run --port=4242
```

**Windows (PowerShell)**

```
$env:FLASK_APP=“server.py"
python3 -m flask run --port=4242
```

4. Forward Stripe events to your local server

```
stripe listen --forward-to localhost:4242/webhook
```

5. Trigger a new authorization request

via CLI

```
stripe trigger issuing_authorization.request
```

or see our docs on testing via dashboard here https://stripe.com/docs/issuing/testing?testing-method=without-code.
