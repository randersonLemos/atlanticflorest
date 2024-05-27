import pathlib
import geopandas as gpd

shape_file = '/mnt/d/meta-feat/tiles-mataatlantica.shp'

tile_folder = '/mnt/c/Users/User/Downloads/AWS/chm/'



if __name__ == '__main__':
    shape = gpd.read_file(shape_file)

    names = list(shape['tile'])

    tile_files = list(pathlib.Path(tile_folder).glob('*.tif'))

    for id, name in enumerate(names):
        for tile_file in tile_files:
            tile_name = tile_file.stem
            if name == tile_name:
                print('OK')


    import IPython; IPython.embed()