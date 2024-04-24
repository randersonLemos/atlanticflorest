import pathlib
import geowombat as gw
import matplotlib.pyplot as plt


def files_from_folder( folder ):
    files = list( map( str, pathlib.Path( folder ).glob('*.tif')) )
    return files


input_folder = '/mnt/d/available/MAPBIOMAS-FIRE-MATAATLANTICA/mapbiomas-brazil-collection-20-mataatlantica-2020'
input_files = files_from_folder(input_folder)


def gwOpenn(files, mosaic=False):
    gwOpen = gw.open(
          files
        , stack_dim='band'
        , mosaic=mosaic
    )
    data = gwOpen.data
    return data, gwOpen




if __name__ == '__main__':
    raster      , gwOpen       = gwOpenn(input_files, mosaic=False) 
    rasterMosaic, gwOpenMosaic = gwOpenn(input_files, mosaic=True) 

    rasters = []
    gwOpens = []
    for input_file in input_files:
        print(input_file)
        r, g = gwOpenn(input_file, mosaic=False)
        rasters.append(r); gwOpens.append(g)


    import IPython; IPython.embed()
