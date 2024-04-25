import json

if __name__ == '__main__':
    with open('canopy-height-resolution.json') as file:
        content = file.read()

    lines = []
    for line in content.replace('\\r', '').split('\\n'):
        print(line)
        lines.append(line)

    with open('eecode.js', 'w') as file:
        file.write( '\n'.join(lines) )




    import IPython;IPython.embed()
