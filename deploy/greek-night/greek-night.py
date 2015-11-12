'''
Sam Hage
Is it greek night?
11/2015
'''


def main():
	"""
	**********************************************************************************************************************
	Code to run on program execution.
	"""
	is_it_greek_night()


def is_it_greek_night():
	"""
	**********************************************************************************************************************
	Determine if it's greek night based on the contents of today.txt

	@return: {boolean} Whether it's greek night or not
	"""
	menu_file = open( 'today.txt', 'r' )
	source = menu_file.read().lower()
	menu_file.close()
	return ( 'artichoke' in source and \
			 'lamb' in source and \
			 'pita' in source )

if __name__ == '__main__':
	main()


















