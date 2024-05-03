import pathlib                                                                                                        
import geowombat as gw                                                                                                
import geopandas as gpd
import matplotlib.pyplot as plt  
from multiprocessing import Process


def files_from_folder( folder ):
    files = list( map( str, pathlib.Path( folder ).glob('*.tif')) )
    return files


raster_folder = '/mnt/d/mapbiomas-lulc/MAPBIOMAS-LULC-MATAATLANTICA'
raster_files = files_from_folder(raster_folder)

shape_file = '/mnt/d/mapbiomas-feat/MAPBIOMAS-FEAT-BRAZIL/brazil.shp'

fig, ax = plt.subplots(dpi=200)

shapeNames = {
      'amazonia' : 'Amaz?nia'
    , 'caatinga' : 'Caatinga'
    , 'cerrado'  : 'Cerrado'
    , 'mataatlantica' : 'Mata Atl?ntica'
    , 'pampa' : 'Pampa'
    , 'pantanal' : 'Pantanal'
}


def gwOpenn(files):
    with gw.open(
          files
        , chuck=1024
        , bounds_by='union'
    ) as src:
        print(src)
    

def gwClip(file, geometry, nodata_value):
    with gw.open(
          file
        , chuck=5*1024
        , bound_by='union'
        , nodata=nodata_value
    ) as src:
        
        # print(src)

        output_file = file.replace('MAPBIOMAS-LULC-MATAATLANTICA', 'MAPABIOMAS-LULC-MATAATLANTICA-CLP').replace('.tif', '.clp.tif')
       
        cli = src.gw.clip(geometry)
        
        # print(cli)

        cli.gw.to_raster(  output_file
                         , compressor='LZW'
                         , bigtiff='YES'
                         , n_works=4
                         , nodata=nodata_value
                         )
        


def main():
    shape = gpd.read_file(shape_file)
    shape = shape[ shape['NAME_PT_BR'] == shapeNames['mataatlantica'] ]
    nodata_value = 0

    ps = []

    for raster_file in raster_files:
        p = Process(
           target=gwClip
         , args=(raster_file, shape.geometry, nodata_value)
        )
        ps.append((
            raster_file, p
        ))

    for name, p in ps:
        p.start()


    for name, p in ps:
        p.join()

              

if __name__ == '__main__':
    main()
    

