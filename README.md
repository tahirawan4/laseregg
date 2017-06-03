# laseregg
How to install

    # root directory to project
    mkvirtualenv laseregg
    
    
    sudo pip install -r requirements.txt
  
After above commands you will be ready to start your project.

But you need to add your data base information in settings.py file

    DATA_BASE_HOST = '127.0.0.1'
    DATA_BASE_NAME = 'laseregg'
    DATA_BASE_USER = 'root'
    DATA_BASE_PASSWORD = 'pw_root'
    DATA_BASE_PORT = '3306'
    
Please fill above values according to your needs.