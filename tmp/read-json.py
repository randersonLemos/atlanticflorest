import json

if __name__ == '__main__':
    with open('canopy-height-resolution.json') as file:
        content = file.read()


    for line in content.replace('\\r', '').split('\\n'):
        print(line)




    import IPython;IPython.embed()
