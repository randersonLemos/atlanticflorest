import pathlib
import geowombat as gw
import matplotlib.pyplot as plt


def files_from_folder( folder ):
    files = list( map( str, pathlib.Path( folder ).glob('*.tif')) )
    return files


input_folder = '/mnt/d/available/MAPBIOMAS-FIRE-MATAATLANTICA/mapbiomas-brazil-collection-20-mataatlantica-2020'
input_files = files_from_folder(input_folder)


def gwOpenMosaic(mosaic=False):
    gwOpen = gw.open(
          input_files
        , stack_dim='band'
        , mosaic=mosaic
    )
    data = gwOpen.data
    return data, gwOpen




if __name__ == '__main__':
    raster, gwOpen = gwOpenMosaic(mosaic=False) 
    rasterMosaic, gwOpenMosaic = gwOpenMosaic(mosaic=True) 


    import IPython; IPython.embed()
